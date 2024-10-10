package actions

import (
	"context"
	"math"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/ava-labs/hypersdk-starter/storage"
	"github.com/ava-labs/hypersdk/chain/chaintest"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/state"
)

func TestClaimDomainAction(t *testing.T) {
	tests := []chaintest.ActionTest{
		{
			Name:  "DomainTooShort",
			Actor: codec.EmptyAddress,
			Action: &ClaimDomain{
				Domain: "a",
			},
			ExpectedErr: ErrDomainTooShort,
		},
		{
			Name:  "DomainTooLong",
			Actor: codec.EmptyAddress,
			Action: &ClaimDomain{
				Domain: "abcdefghijk", // 11 characters
			},
			ExpectedErr: ErrDomainTooLong,
		},
		{
			Name:  "DomainAlreadyTaken",
			Actor: codec.EmptyAddress,
			Action: &ClaimDomain{
				Domain: "test",
			},
			State: func() state.Mutable {
				store := chaintest.NewInMemoryStore()
				require.NoError(t, storage.SetDomainOwner(context.Background(), store, "test", codec.EmptyAddress))
				return store
			}(),
			ExpectedErr: ErrDomainAlreadyTaken,
		},
		{
			Name:  "InsufficientFunds",
			Actor: codec.EmptyAddress,
			Action: &ClaimDomain{
				Domain: "test",
			},
			State: func() state.Mutable {
				store := chaintest.NewInMemoryStore()
				require.NoError(t, storage.SetBalance(context.Background(), store, codec.EmptyAddress, 1))
				return store
			}(),
			ExpectedErr: ErrInsufficientFunds,
		},
		{
			Name:  "SuccessfulClaim",
			Actor: codec.EmptyAddress,
			Action: &ClaimDomain{
				Domain: "test",
			},
			State: func() state.Mutable {
				store := chaintest.NewInMemoryStore()
				require.NoError(t, storage.SetBalance(context.Background(), store, codec.EmptyAddress, math.MaxUint64))
				return store
			}(),
			Assertion: func(ctx context.Context, t *testing.T, store state.Mutable) {
				owner, exists, err := storage.GetDomainOwner(ctx, store, "test")
				require.NoError(t, err)
				require.True(t, exists)
				require.Equal(t, codec.EmptyAddress, owner)

				balance, err := storage.GetBalance(ctx, store, codec.EmptyAddress)
				require.NoError(t, err)
				require.Equal(t, uint64(math.MaxUint64-1e7), balance) // 10^7 for 4-letter domain
			},
			ExpectedOutputs: &ClaimDomainResult{
				AmountPaid: 1e7,
			},
		},
		{
			Name:  "TwoLetterPrice",
			Actor: codec.EmptyAddress,
			Action: &ClaimDomain{
				Domain: "hi",
			},
			State: func() state.Mutable {
				store := chaintest.NewInMemoryStore()
				require.NoError(t, storage.SetBalance(context.Background(), store, codec.EmptyAddress, math.MaxUint64))
				return store
			}(),
			Assertion: nil,
			ExpectedOutputs: &ClaimDomainResult{
				AmountPaid: 1e9,
			},
		},
		{
			Name:  "TenLetterPrice",
			Actor: codec.EmptyAddress,
			Action: &ClaimDomain{
				Domain: "1234567890",
			},
			State: func() state.Mutable {
				store := chaintest.NewInMemoryStore()
				require.NoError(t, storage.SetBalance(context.Background(), store, codec.EmptyAddress, math.MaxUint64))
				return store
			}(),
			Assertion: nil,
			ExpectedOutputs: &ClaimDomainResult{
				AmountPaid: 10,
			},
		},
	}

	for _, tt := range tests {
		tt.Run(context.Background(), t)
	}
}
