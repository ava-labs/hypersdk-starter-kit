package genesis

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/ava-labs/avalanchego/ids"
	"github.com/ava-labs/avalanchego/trace"
	"github.com/ava-labs/avalanchego/x/merkledb"
	"github.com/ava-labs/hypersdk-starter/consts"
	"github.com/ava-labs/hypersdk-starter/storage"
	"github.com/ava-labs/hypersdk/chain"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/state"

	safemath "github.com/ava-labs/avalanchego/utils/math"
	hgenesis "github.com/ava-labs/hypersdk/genesis"
)

type DefaultGenesis struct {
	StateBranchFactor merkledb.BranchFactor `json:"stateBranchFactor"`
	CustomAllocation  []*hgenesis.CustomAllocation   `json:"customAllocation"`
	Rules             *hgenesis.Rules                `json:"initialRules"`
}

func NewDefaultGenesis(customAllocations []*hgenesis.CustomAllocation) *DefaultGenesis {
	return &DefaultGenesis{
		StateBranchFactor: merkledb.BranchFactor16,
		CustomAllocation:  customAllocations,
		Rules:             hgenesis.NewDefaultRules(),
	}
}

func (g *DefaultGenesis) InitializeState(ctx context.Context, tracer trace.Tracer, mu state.Mutable, balanceHandler chain.BalanceHandler) error {
	_, span := tracer.Start(ctx, "Genesis.InitializeState")
	defer span.End()

	var (
		supply uint64
		err    error
	)

	// We need to initialize the chain coin
	if err := storage.SetTokenInfo(ctx, mu, storage.CoinAddress, []byte(consts.Name), []byte(storage.Symbol), []byte(storage.Metadata), 0, codec.EmptyAddress); err != nil { 
		return err
	}

	for _, alloc := range g.CustomAllocation {
		supply, err = safemath.Add(supply, alloc.Balance)
		if err != nil {
			return err
		}
		if err := balanceHandler.AddBalance(ctx, alloc.Address, mu, alloc.Balance, true); err != nil {
			return fmt.Errorf("%w: addr=%s, bal=%d", err, alloc.Address, alloc.Balance)
		}
	}
	return nil
}

func (g *DefaultGenesis) GetStateBranchFactor() merkledb.BranchFactor {
	return g.StateBranchFactor
}

type DefaultGenesisFactory struct{}

func (DefaultGenesisFactory) Load(genesisBytes []byte, _ []byte, networkID uint32, chainID ids.ID) (hgenesis.Genesis, hgenesis.RuleFactory, error) {
	genesis := &DefaultGenesis{}
	if err := json.Unmarshal(genesisBytes, genesis); err != nil {
		return nil, nil, err
	}
	genesis.Rules.NetworkID = networkID
	genesis.Rules.ChainID = chainID

	return genesis, &hgenesis.ImmutableRuleFactory{Rules: genesis.Rules}, nil
}
