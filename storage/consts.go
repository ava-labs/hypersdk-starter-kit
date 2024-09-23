// Copyright (C) 2024, Ava Labs, Inc. All rights reserved.
// See the file LICENSE for licensing terms.

package storage

import (
	"math"

	"github.com/ava-labs/hypersdk-starter/consts"
	"github.com/ava-labs/hypersdk/codec"
)

// Key prefixes
const (
	// Required for StateManager
	balancePrefix   = 0x0
	heightPrefix    = 0x1
	timestampPrefix = 0x2
	feePrefix       = 0x3

	// Required for CFMMVM
	tokenInfoPrefix           = 0x4
	tokenAccountBalancePrefix = 0x5
	liquidityPoolPrefix       = 0x6
)

// TODO: tune these values
// Chunks
const (
	TokenAddressChunks        uint16 = 1
	TokenInfoChunks           uint16 = 2
	TokenAccountBalanceChunks uint16 = 1
	LiquidityPoolChunks       uint16 = 3
)

// Related to action invariants
const (
	MaxTokenNameSize     = 64
	MaxTokenSymbolSize   = 8
	MaxTokenMetadataSize = 256
	MaxTokenDecimals     = 18
)

// All LP tokens have the following data
const (
	LiquidityPoolTokenName     = "CFMM-Pair" // #nosec G101
	LiquidityPoolTokenSymbol   = "CFMMP"
	LiquidityPoolTokenDecimals = 9
	LiquidityPoolTokenMetadata = "A liquidity pool"
)

// Data for CFMM-VM Coin
const (
	Symbol   = "CVM"
	Metadata = "A constant-function market-maker VM implementation"
)

var (
	MinimumLiquidity = uint64(math.Pow10(3))
	CoinAddress      codec.Address
)

func init() {
	CoinAddress = TokenAddress([]byte(consts.Name), []byte(Symbol), []byte(Metadata))
}
