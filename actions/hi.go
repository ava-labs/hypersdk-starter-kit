// Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

package actions

import (
	"context"
	"fmt"

	"github.com/ava-labs/avalanchego/ids"

	"github.com/ava-labs/hypersdk-starter/storage"
	"github.com/ava-labs/hypersdk/chain"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/state"
)

const (
	HiComputeUnits = 1
	MaxNameSize    = 256
)

var (
	ErrNameTooLarge              = fmt.Errorf("name is too large")
	_               chain.Action = (*Hi)(nil)
)

type Hi struct {
	Name codec.Bytes `serialize:"true" json:"name"`
}

type HiResult struct {
	Greeting []byte `serialize:"true" json:"greeting"`
	Balance  uint64 `serialize:"true" json:"balance"`
}

func (*Hi) GetTypeID() uint8 {
	return 1
}

func (h *Hi) StateKeys(actor codec.Address, _ ids.ID) state.Keys {
	return state.Keys{
		string(storage.BalanceKey(actor)): state.Read,
	}
}

func (*Hi) StateKeysMaxChunks() []uint16 {
	return []uint16{storage.BalanceChunks}
}

func (h *Hi) Execute(
	ctx context.Context,
	_ chain.Rules,
	mu state.Mutable,
	_ int64,
	actor codec.Address,
	_ ids.ID,
) ([][]byte, error) {
	if len(h.Name) > MaxNameSize {
		return nil, ErrNameTooLarge
	}

	balance, err := storage.GetBalance(ctx, mu, actor)
	if err != nil {
		return nil, err
	}

	greeting := fmt.Sprintf("Hi, %s", string(h.Name))

	bytes, err := codec.Marshal(HiResult{
		Greeting: []byte(greeting),
		Balance:  balance,
	})

	return [][]byte{bytes}, err
}

func (*Hi) ComputeUnits(chain.Rules) uint64 {
	return HiComputeUnits
}

func (*Hi) ValidRange(chain.Rules) (int64, int64) {
	return -1, -1
}
