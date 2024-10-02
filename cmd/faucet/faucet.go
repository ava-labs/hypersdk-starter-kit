// Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

package main

import (
	"context"
	"crypto/rand"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"golang.org/x/time/rate"

	"github.com/ava-labs/avalanchego/ids"
	"github.com/ava-labs/hypersdk-starter/consts"
	"github.com/ava-labs/hypersdk-starter/vm"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/utils"
)

const (
	faucetServerPort = "8765"
)

var (
	hyperVMRPC *vm.JSONRPCClient
	isReady    bool
	healthMu   sync.RWMutex
)

func init() {
	rpcEndpoint := os.Getenv("RPC_ENDPOINT")
	if rpcEndpoint == "" {
		log.Fatalf("RPC_ENDPOINT is not set")
	}
	url := fmt.Sprintf("%s/ext/bc/%s", rpcEndpoint, consts.Name)
	hyperVMRPC = vm.NewJSONRPCClient(url)
}

func faucetDrip(to string) (string, error) {
	to = strings.TrimPrefix(to, "0x")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	toAddr, err := codec.StringToAddress(to)
	if err != nil {
		return "", fmt.Errorf("failed to parse to address: %w", err)
	}

	balanceBefore, err := hyperVMRPC.Balance(ctx, toAddr)
	if err != nil {
		return "", fmt.Errorf("failed to get balance: %w", err)
	}
	log.Printf("Balance before: %s\n", utils.FormatBalance(balanceBefore))

	threshold, _ := utils.ParseBalance("1.000")
	if balanceBefore > threshold {
		log.Printf("Balance is already greater than 1.000, no transfer needed\n")
		return "Balance is already greater than 1.000, no transfer needed", nil
	}

	txID, err := hyperVMRPC.FaucetDrip(ctx, toAddr)
	if err != nil {
		return "", fmt.Errorf("failed to drip from faucet: %w", err)
	}

	return fmt.Sprintf("Faucet drip successful. Transaction ID: %s", txID), nil
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
	randomBytes := make([]byte, 32)
	_, err := rand.Read(randomBytes)
	if err != nil {
		log.Fatalf("Failed to generate random bytes: %v", err)
	}
	randomId, err := ids.ToID(randomBytes)
	if err != nil {
		log.Fatalf("Failed to generate random ID: %v", err)
	}

	randomAddressHex := codec.CreateAddress(0, randomId)
	log.Printf("Performing initial transfer to ready check address: %s\n", randomAddressHex.String())

	for i := 0; i < 10; i++ {
		message, err := faucetDrip(randomAddressHex.String())
		if err == nil {
			log.Printf("Initial transfer result: %s\n", message)
			setReady(true)
			log.Println("Faucet is now healthy and ready to serve requests")
			return
		}
		log.Printf("Attempt %d failed to perform initial transfer: %v\n", i+1, err)
		time.Sleep(time.Duration(i+1) * time.Second)
	}

	log.Fatal("Faucet initialization failed after 10 attempts. Exiting.")
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

	message, err := faucetDrip(address)
	if err != nil {
		log.Printf("Failed to drip from faucet: %v\n", err)
		http.Error(w, fmt.Sprintf("Failed to drip from faucet: %v", err), http.StatusInternalServerError)
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
