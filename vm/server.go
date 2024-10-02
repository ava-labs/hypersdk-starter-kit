// Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

package vm

import (
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/ava-labs/hypersdk-starter/actions"
	"github.com/ava-labs/hypersdk-starter/consts"
	"github.com/ava-labs/hypersdk-starter/storage"
	"github.com/ava-labs/hypersdk/api"
	"github.com/ava-labs/hypersdk/auth"
	"github.com/ava-labs/hypersdk/chain"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/crypto/ed25519"
	"github.com/ava-labs/hypersdk/genesis"
	"github.com/ava-labs/hypersdk/utils"
)

const JSONRPCEndpoint = "/morpheusapi"

var _ api.HandlerFactory[api.VM] = (*jsonRPCServerFactory)(nil)

type jsonRPCServerFactory struct{}

func (jsonRPCServerFactory) New(vm api.VM) (api.Handler, error) {
	handler, err := api.NewJSONRPCHandler(consts.Name, NewJSONRPCServer(vm))
	return api.Handler{
		Path:    JSONRPCEndpoint,
		Handler: handler,
	}, err
}

type JSONRPCServer struct {
	vm api.VM
}

func NewJSONRPCServer(vm api.VM) *JSONRPCServer {
	return &JSONRPCServer{vm: vm}
}

type GenesisReply struct {
	Genesis *genesis.DefaultGenesis `json:"genesis"`
}

func (j *JSONRPCServer) Genesis(_ *http.Request, _ *struct{}, reply *GenesisReply) (err error) {
	reply.Genesis = j.vm.Genesis().(*genesis.DefaultGenesis)
	return nil
}

type BalanceArgs struct {
	Address codec.Address `json:"address"`
}

type BalanceReply struct {
	Amount uint64 `json:"amount"`
}

func (j *JSONRPCServer) Balance(req *http.Request, args *BalanceArgs, reply *BalanceReply) error {
	ctx, span := j.vm.Tracer().Start(req.Context(), "Server.Balance")
	defer span.End()

	balance, err := storage.GetBalanceFromState(ctx, j.vm.ReadState, args.Address)
	if err != nil {
		return err
	}
	reply.Amount = balance
	return err
}

type FaucetDripArgs struct {
	Address codec.Address `json:"address"`
}

type FaucetDripReply struct {
	TxID    string `json:"txID"`
	Message string `json:"message"`
}

func (j *JSONRPCServer) FaucetDrip(req *http.Request, args *FaucetDripArgs, reply *FaucetDripReply) error {
	ctx, span := j.vm.Tracer().Start(req.Context(), "Server.FaucetDrip")
	defer span.End()

	// Print all environment variables with values
	fmt.Println("Environment Variables:")
	for _, env := range os.Environ() {
		fmt.Println(env)
	}

	faucetPrivateKeyHex := os.Getenv("FAUCET_PRIVATE_KEY_HEX")
	if faucetPrivateKeyHex == "" {
		return fmt.Errorf("faucet disabled")
	}

	privBytes, err := hex.DecodeString(faucetPrivateKeyHex)
	if err != nil {
		log.Fatalf("failed to load private key: %v", err)
	}
	priv := ed25519.PrivateKey(privBytes)
	factory := auth.NewED25519Factory(priv)

	// Check balance
	balance, err := storage.GetBalanceFromState(ctx, j.vm.ReadState, args.Address)
	if err != nil {
		return err
	}

	threshold, err := utils.ParseBalance("1.000")
	if err != nil {
		return fmt.Errorf("failed to parse threshold: %w", err)
	}

	if balance > threshold {
		reply.Message = "Address already funded"
		return nil
	}

	// Prepare transfer action
	amount, err := utils.ParseBalance("10.00")
	if err != nil {
		return fmt.Errorf("failed to parse amount: %w", err)
	}

	transferAction := &actions.Transfer{
		To:    args.Address,
		Value: amount,
	}

	// Generate and submit transaction
	tx := chain.NewTx(
		&chain.Base{
			Timestamp: utils.UnixRMilli(time.Now().UnixMilli(), j.vm.Rules(time.Now().UnixMilli()).GetValidityWindow()),
			ChainID:   j.vm.ChainID(),
			MaxFee:    100000, //FIXME: use estimation instead
		},
		[]chain.Action{transferAction},
	)
	if err != nil {
		return fmt.Errorf("failed to create transaction: %w", err)
	}

	tx, err = tx.Sign(factory, j.vm.ActionRegistry(), j.vm.AuthRegistry())
	if err != nil {
		return fmt.Errorf("failed to sign transaction: %w", err)
	}

	errs := j.vm.Submit(ctx, true, []*chain.Transaction{tx})
	if len(errs) > 0 && errs[0] != nil {
		return fmt.Errorf("failed to submit transaction: %w", errs[0])
	}

	reply.TxID = tx.ID().String()
	reply.Message = "Faucet drip successful"
	return nil
}
