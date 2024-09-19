// Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

package main

import (
	"context"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"golang.org/x/time/rate"

	"github.com/ava-labs/hypersdk-starter/actions"
	"github.com/ava-labs/hypersdk-starter/consts"
	"github.com/ava-labs/hypersdk-starter/vm"
	"github.com/ava-labs/hypersdk/api/jsonrpc"
	"github.com/ava-labs/hypersdk/auth"
	"github.com/ava-labs/hypersdk/chain"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/crypto/ed25519"
	"github.com/ava-labs/hypersdk/utils"
)

const (
	amtStr           = "10.00"
	faucetServerPort = "8765"
)

var (
	priv        ed25519.PrivateKey
	factory     chain.AuthFactory
	hyperVMRPC  *vm.JSONRPCClient
	hyperSDKRPC *jsonrpc.JSONRPCClient
	isReady     bool
	healthMu    sync.RWMutex
)

func init() {
	privBytes, err := hex.DecodeString(os.Getenv("FAUCET_PRIVATE_KEY_HEX"))
	if err != nil {
		log.Fatalf("failed to load private key: %v", err)
	}
	priv = ed25519.PrivateKey(privBytes)
	factory = auth.NewED25519Factory(priv)

	myAddressHex := auth.NewED25519Address(priv.PublicKey()).String()
	log.Printf("Faucet address: %s\n", myAddressHex)

	rpcEndpoint := os.Getenv("RPC_ENDPOINT")
	if rpcEndpoint == "" {
		log.Fatalf("RPC_ENDPOINT is not set")
	}
	url := fmt.Sprintf("%s/ext/bc/%s", rpcEndpoint, consts.Name)
	hyperVMRPC = vm.NewJSONRPCClient(url)
	hyperSDKRPC = jsonrpc.NewJSONRPCClient(url)
}

func transferCoins(to string) (string, error) {
	toAddr, err := codec.StringToAddress(to)
	if err != nil {
		return "", fmt.Errorf("failed to parse to address: %w", err)
	}

	amt, err := utils.ParseBalance(amtStr, consts.Decimals)
	if err != nil {
		return "", fmt.Errorf("failed to parse amount: %w", err)
	}

	balanceBefore, err := hyperVMRPC.Balance(context.TODO(), toAddr)
	if err != nil {
		return "", fmt.Errorf("failed to get balance: %w", err)
	}
	log.Printf("Balance before: %s\n", utils.FormatBalance(balanceBefore, consts.Decimals))

	threshold, _ := utils.ParseBalance("1.000", consts.Decimals)
	if balanceBefore > threshold {
		log.Printf("Balance is already greater than 1.000, no transfer needed\n")
		return "Balance is already greater than 1.000, no transfer needed", nil
	}

	parser, err := hyperVMRPC.Parser(context.TODO())
	if err != nil {
		return "", fmt.Errorf("failed to get parser: %w", err)
	}

	submit, _, _, err := hyperSDKRPC.GenerateTransaction(
		context.TODO(),
		parser,
		[]chain.Action{&actions.Transfer{
			To:    toAddr,
			Value: amt,
		}},
		factory,
	)
	if err != nil {
		return "", fmt.Errorf("failed to generate transaction: %w", err)
	}

	if err := submit(context.TODO()); err != nil {
		return "", fmt.Errorf("failed to submit transaction: %w", err)
	}

	if err := hyperVMRPC.WaitForBalance(context.TODO(), toAddr, amt); err != nil {
		return "", fmt.Errorf("failed to wait for balance: %w", err)
	}

	return "Coins transferred successfully", nil
}

func main() {
	r := mux.NewRouter()
	r.HandleFunc("/", handleAPIDocumentation).Methods("GET")
	r.HandleFunc("/faucet/{address}", handleFaucetRequest).Methods("GET", "POST")
	r.HandleFunc("/readyz", handleReadyCheck).Methods("GET")

	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders: []string{"*"},
	})

	handler := c.Handler(r)

	performInitialTransfer()

	srv := &http.Server{
		Addr:         ":" + faucetServerPort,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	log.Printf("Starting faucet server on port %s\n", faucetServerPort)
	log.Printf("API documentation: http://localhost:%s/\n", faucetServerPort)
	log.Printf("Ready check endpoint: http://localhost:%s/readyz\n", faucetServerPort)
	log.Printf("Faucet endpoint: http://localhost:%s/faucet/{address}\n", faucetServerPort)

	if err := srv.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
func handleAPIDocumentation(w http.ResponseWriter, r *http.Request) {
	apiDoc := `Faucet API Guide

1. "/" - You're here! This page provides API documentation.
2. "/faucet/{address}" - Request tokens for testing (GET or POST).
3. "/readyz" - Check if the faucet is operational.`

	w.Header().Set("Content-Type", "text/plain")
	fmt.Fprint(w, apiDoc)
}

func performInitialTransfer() {
	zeroAddressHex := codec.EmptyAddress.String()
	log.Println("Performing initial transfer to ready check address...")

	for i := 0; i < 10; i++ {
		message, err := transferCoins(zeroAddressHex)
		if err == nil {
			log.Printf("Initial transfer result: %s\n", message)
			setReady(true)
			log.Println("Faucet is now healthy and ready to serve requests")
			return
		}
		log.Printf("Attempt %d failed to perform initial transfer: %v\n", i+1, err)
		time.Sleep(time.Duration(i+1) * time.Second)
	}

	log.Fatal("Faucet initialization failed after 5 attempts. Exiting.")
}

func setReady(status bool) {
	healthMu.Lock()
	defer healthMu.Unlock()
	isReady = status
}

func getReadyStatus() bool {
	healthMu.RLock()
	defer healthMu.RUnlock()
	return isReady
}

func handleReadyCheck(w http.ResponseWriter, r *http.Request) {
	if getReadyStatus() {
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, "Faucet is healthy")
	} else {
		w.WriteHeader(http.StatusServiceUnavailable)
		fmt.Fprint(w, "Faucet is not yet healthy")
	}
}

var (
	ipLimiters = make(map[string]*rate.Limiter)
	mu         sync.Mutex
)

func handleFaucetRequest(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "*")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	clientIP := r.RemoteAddr

	if !getRateLimiter(clientIP).Allow() {
		http.Error(w, "Rate limit exceeded. Please try again later.", http.StatusTooManyRequests)
		return
	}

	vars := mux.Vars(r)
	address := vars["address"]
	if address == "" {
		http.Error(w, "Address not provided", http.StatusBadRequest)
		return
	}

	message, err := transferCoins(address)
	if err != nil {
		log.Printf("Failed to transfer coins: %v\n", err)
		http.Error(w, fmt.Sprintf("Failed to transfer coins: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	fmt.Fprint(w, message)
}

func getRateLimiter(ip string) *rate.Limiter {
	mu.Lock()
	defer mu.Unlock()

	limiter, exists := ipLimiters[ip]
	if !exists {
		limiter = rate.NewLimiter(rate.Every(15*time.Second), 10)
		ipLimiters[ip] = limiter
	}

	return limiter
}
