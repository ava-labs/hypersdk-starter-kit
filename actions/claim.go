package actions

import (
	"context"
	"errors"
	"math"

	"github.com/ava-labs/avalanchego/ids"
	"github.com/ava-labs/hypersdk/chain"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/state"

	mconsts "github.com/ava-labs/hypersdk-starter/consts"
	"github.com/ava-labs/hypersdk-starter/storage"
)

const (
	ClaimDomainComputeUnits = 2
	MaxDomainLength         = 10
)

var (
	ErrDomainTooLong                   = errors.New("domain is too long")
	ErrDomainTooShort                  = errors.New("domain is too short")
	ErrDomainAlreadyTaken              = errors.New("domain is already taken")
	ErrInsufficientFunds               = errors.New("insufficient funds for domain registration")
	_                     chain.Action = (*ClaimDomain)(nil)
)

type ClaimDomain struct {
	Domain string `serialize:"true" json:"domain"`
}

func (*ClaimDomain) GetTypeID() uint8 {
	return mconsts.ClaimDomainID
}

func (c *ClaimDomain) StateKeys(actor codec.Address) state.Keys {
	return state.Keys{
		string(storage.BalanceKey(actor)):        state.Read | state.Write,
		string(storage.DomainOwnerKey(c.Domain)): state.Read | state.Write | state.Allocate,
	}
}

func (c *ClaimDomain) Execute(
	ctx context.Context,
	_ chain.Rules,
	mu state.Mutable,
	_ int64,
	actor codec.Address,
	_ ids.ID,
) (codec.Typed, error) {
	domainLength := len(c.Domain)
	if domainLength < 2 {
		return nil, ErrDomainTooShort
	}
	if domainLength > MaxDomainLength {
		return nil, ErrDomainTooLong
	}

	// Check if domain is already taken
	_, exists, err := storage.GetDomainOwner(ctx, mu, c.Domain)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrDomainAlreadyTaken
	}

	// Calculate required payment
	requiredPayment := uint64(math.Pow10(11 - domainLength))

	// Deduct payment from actor's balance
	_, err = storage.SubBalance(ctx, mu, actor, requiredPayment)
	if err != nil {
		return nil, ErrInsufficientFunds
	}

	// Register the domain
	if err := storage.SetDomainOwner(ctx, mu, c.Domain, actor); err != nil {
		return nil, err
	}

	return &ClaimDomainResult{
		AmountPaid: requiredPayment,
	}, nil
}

func (*ClaimDomain) ComputeUnits(chain.Rules) uint64 {
	return ClaimDomainComputeUnits
}

func (*ClaimDomain) ValidRange(chain.Rules) (int64, int64) {
	// Returning -1, -1 means that the action is always valid.
	return -1, -1
}

var _ codec.Typed = (*ClaimDomainResult)(nil)

type ClaimDomainResult struct {
	AmountPaid uint64 `serialize:"true" json:"amount_paid"`
}

func (*ClaimDomainResult) GetTypeID() uint8 {
	return mconsts.ClaimDomainID
}
