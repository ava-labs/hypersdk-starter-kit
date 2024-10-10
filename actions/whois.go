package actions

import (
	"context"

	"github.com/ava-labs/avalanchego/ids"
	"github.com/ava-labs/hypersdk/chain"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/state"

	mconsts "github.com/ava-labs/hypersdk-starter/consts"
	"github.com/ava-labs/hypersdk-starter/storage"
)

const (
	WhoisComputeUnits = 1
)

var _ chain.Action = (*Whois)(nil)

type Whois struct {
	Domain string `serialize:"true" json:"domain"`
}

func (*Whois) GetTypeID() uint8 {
	return mconsts.WhoisID
}

func (w *Whois) StateKeys(_ codec.Address) state.Keys {
	return state.Keys{
		string(storage.DomainOwnerKey(w.Domain)): state.Read,
	}
}

func (w *Whois) Execute(
	ctx context.Context,
	_ chain.Rules,
	mu state.Mutable,
	_ int64,
	_ codec.Address,
	_ ids.ID,
) (codec.Typed, error) {
	owner, exists, err := storage.GetDomainOwner(ctx, mu, w.Domain)
	if err != nil {
		return nil, err
	}

	return &WhoisResult{
		Found: exists,
		Owner: owner,
	}, nil
}

func (*Whois) ComputeUnits(chain.Rules) uint64 {
	return 0 //read only
}

func (*Whois) ValidRange(chain.Rules) (int64, int64) {
	// Returning -1, -1 means that the action is always valid.
	return -1, -1
}

var _ codec.Typed = (*WhoisResult)(nil)

type WhoisResult struct {
	Found bool          `serialize:"true" json:"found"`
	Owner codec.Address `serialize:"true" json:"owner"`
}

func (*WhoisResult) GetTypeID() uint8 {
	return mconsts.WhoisID
}
