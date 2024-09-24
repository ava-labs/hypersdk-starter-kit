// Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

package actions

import (
	"context"

	"github.com/ava-labs/avalanchego/ids"

	"github.com/ava-labs/hypersdk-starter/consts"
	"github.com/ava-labs/hypersdk-starter/pricing"
	"github.com/ava-labs/hypersdk-starter/storage"
	"github.com/ava-labs/hypersdk/chain"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/state"
)

var (
	_ codec.Typed  = (*CreateLiquidityPoolResult)(nil)
	_ chain.Action = (*CreateLiquidityPool)(nil)
)

type CreateLiquidityPoolResult struct {
	PoolAddress      codec.Address `serialize:"true" json:"poolAddress"`
	PoolTokenAddress codec.Address `serialize:"true" json:"poolTokenAddress"`
}

func (*CreateLiquidityPoolResult) GetTypeID() uint8 {
	return consts.CreateLiquidityPoolID
}

type CreateLiquidityPool struct {
	FunctionID uint8         `serialize:"true" json:"functionID"`
	TokenX     codec.Address `serialize:"true" json:"tokenX"`
	TokenY     codec.Address `serialize:"true" json:"tokenY"`
	Fee        uint64        `serialize:"true" json:"fee"`
}

func (*CreateLiquidityPool) ComputeUnits(chain.Rules) uint64 {
	return CreateLiquidityPoolUnits
}

func (c *CreateLiquidityPool) Execute(ctx context.Context, _ chain.Rules, mu state.Mutable, _ int64, actor codec.Address, _ ids.ID) (codec.Typed, error) {
	// Assert argument invariants
	if c.Fee == 0 {
		return nil, ErrOutputInvalidFee
	}
	// Check that tokens + function exist
	if !storage.TokenExists(ctx, mu, c.TokenX) {
		return nil, ErrOutputTokenXDoesNotExist
	}
	if !storage.TokenExists(ctx, mu, c.TokenY) {
		return nil, ErrOutputTokenYDoesNotExist
	}

	_, ok := pricing.Models[c.FunctionID]
	if !ok {
		return nil, ErrOutputFunctionDoesNotExist
	}

	poolAddress := storage.LiquidityPoolAddress(c.TokenX, c.TokenY)
	// Check that LP does not already exist
	if storage.LiquidityPoolExists(ctx, mu, poolAddress) {
		return nil, ErrOutputLiquidityPoolAlreadyExists
	}
	// Create token
	lpTokenAddress := storage.LiqudityPoolTokenAddress(poolAddress)
	if err := storage.SetTokenInfo(ctx, mu, lpTokenAddress, []byte(storage.LiquidityPoolTokenName), []byte(storage.LiquidityPoolTokenSymbol), []byte(storage.LiquidityPoolTokenMetadata), 0, poolAddress); err != nil {
		return nil, err
	}
	// Create LP
	if err := storage.SetLiquidityPool(ctx, mu, poolAddress, c.FunctionID, c.TokenX, c.TokenY, c.Fee, actor, 0, 0, lpTokenAddress, 0); err != nil {
		return nil, err
	}

	return &CreateLiquidityPoolResult{
		PoolAddress:      poolAddress,
		PoolTokenAddress: lpTokenAddress,
	}, nil
}

func (*CreateLiquidityPool) GetTypeID() uint8 {
	return consts.CreateLiquidityPoolID
}

func (c *CreateLiquidityPool) StateKeys(_ codec.Address, _ ids.ID) state.Keys {
	tokenXKey := storage.TokenInfoKey(c.TokenX)
	tokenYKey := storage.TokenInfoKey(c.TokenY)
	lpAddress := storage.LiquidityPoolAddress(c.TokenX, c.TokenY)
	lpKey := storage.LiquidityPoolKey(lpAddress)
	lpTokenKey := storage.TokenInfoKey(storage.LiqudityPoolTokenAddress(lpAddress))
	return state.Keys{
		string(tokenXKey):  state.Read,
		string(tokenYKey):  state.Read,
		string(lpKey):      state.All,
		string(lpTokenKey): state.All,
	}
}

func (*CreateLiquidityPool) StateKeysMaxChunks() []uint16 {
	return []uint16{
		storage.TokenInfoChunks,
		storage.TokenInfoChunks,
		storage.LiquidityPoolChunks,
		storage.TokenInfoChunks,
	}
}

func (*CreateLiquidityPool) ValidRange(chain.Rules) (int64, int64) {
	return -1, -1
}