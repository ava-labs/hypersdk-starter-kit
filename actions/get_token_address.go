// Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

package actions

import (
	"context"

	"github.com/ava-labs/avalanchego/ids"

	"github.com/ava-labs/hypersdk-starter/consts"
	"github.com/ava-labs/hypersdk-starter/storage"
	"github.com/ava-labs/hypersdk/chain"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/state"
)

var (
	_ codec.Typed  = (*GetTokenInfoResult)(nil)
	_ chain.Action = (*GetTokenInfo)(nil)
)

type GetTokenAddressResult struct {
	Address codec.Address `serialize:"true" json:"address"`
}

// GetTypeID implements codec.Typed.
func (*GetTokenAddressResult) GetTypeID() uint8 {
	return consts.GetTokenAddressID
}

type GetTokenAddress struct {
	Name     []byte `serialize:"true" json:"name"`
	Symbol   []byte `serialize:"true" json:"symbol"`
	Metadata []byte `serialize:"true" json:"metadata"`
}

func (g *GetTokenAddress) ComputeUnits(chain.Rules) uint64 {
	return GetTokenAddressUnits
}

func (g *GetTokenAddress) Execute(ctx context.Context, r chain.Rules, mu state.Mutable, timestamp int64, actor codec.Address, actionID ids.ID) (codec.Typed, error) {
	tokenAddress := storage.TokenAddress(g.Name, g.Symbol, g.Metadata)
	return &GetTokenAddressResult{
		Address: tokenAddress,
	}, nil

}

func (g *GetTokenAddress) GetTypeID() uint8 {
	return consts.GetTokenAddressID
}

func (g *GetTokenAddress) StateKeys(actor codec.Address, actionID ids.ID) state.Keys {
	tokenAddress := storage.TokenAddress(g.Name, g.Symbol, g.Metadata)
	return state.Keys{
		string(storage.TokenInfoKey(tokenAddress)): state.Read,
	}
}

func (g *GetTokenAddress) StateKeysMaxChunks() []uint16 {
	return []uint16{storage.TokenAddressChunks}
}

func (g *GetTokenAddress) ValidRange(chain.Rules) (start int64, end int64) {
	return -1, -1
}
