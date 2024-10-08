package bug_test

import (
	"context"
	"testing"
	"time"

	"github.com/ava-labs/hypersdk-starter/actions"
	"github.com/ava-labs/hypersdk-starter/vm"
	"github.com/ava-labs/hypersdk/api/indexer"
	"github.com/ava-labs/hypersdk/api/jsonrpc"
	"github.com/ava-labs/hypersdk/auth"
	"github.com/ava-labs/hypersdk/chain"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/crypto/ed25519"
	"github.com/ava-labs/hypersdk/genesis"
	"github.com/stretchr/testify/require"
)

const (
	uri = "http://[::]:9650/ext/bc/FKX951GQka35CPCbpi75oZhQ1yG4m7EbjgqNe8SzhLib8E8n1"

	initialBalance  uint64 = 10_000_000_000_000
	txCheckInterval        = 100 * time.Millisecond
)

var (
	ed25519HexKeys = []string{
		"323b1d8f4eed5f0da9da93071b034f2dce9d2d22692c172f3cb252a64ddfafd01b057de320297c29ad0c1f589ea216869cf1938d88c9fbd70d6748323dbf2fa7", //nolint:lll
		"8a7be2e0c9a2d09ac2861c34326d6fe5a461d920ba9c2b345ae28e603d517df148735063f8d5d8ba79ea4668358943e5c80bc09e9b2b9a15b5b15db6c1862e88", //nolint:lll
	}
	ed25519PrivKeys      = make([]ed25519.PrivateKey, len(ed25519HexKeys))
	ed25519Addrs         = make([]codec.Address, len(ed25519HexKeys))
	ed25519AuthFactories = make([]*auth.ED25519Factory, len(ed25519HexKeys))
)

func init() {
	for i, keyHex := range ed25519HexKeys {
		privBytes, err := codec.LoadHex(keyHex, ed25519.PrivateKeyLen)
		if err != nil {
			panic(err)
		}
		priv := ed25519.PrivateKey(privBytes)
		ed25519PrivKeys[i] = priv
		ed25519AuthFactories[i] = auth.NewED25519Factory(priv)
		addr := auth.NewED25519Address(priv.PublicKey())
		ed25519Addrs[i] = addr
	}
}

// Requires that CFMM-VM is running in the background via `./scripts/run.sh`
func TestExpectedBug(t *testing.T) {
	require := require.New(t)

	cli := jsonrpc.NewJSONRPCClient(uri)
	lcli := vm.NewJSONRPCClient(uri)

	// Ping for sanity check
	_, err := cli.Ping(context.Background())
	require.NoError(err)

	t.Log("pinged node")

	customAllocs := make([]*genesis.CustomAllocation, 0)
	for _, prefundedAddr := range ed25519Addrs {
		customAllocs = append(customAllocs, &genesis.CustomAllocation{
			Address: prefundedAddr,
			Balance: initialBalance,
		})
	}

	// Create action
	action := actions.CreateToken{
		Name:     []byte("RodrigoCoin"),
		Symbol:   []byte("RC"),
		Metadata: []byte("Rodrigo's Coin"),
	}

	parser, err := lcli.Parser(context.Background())
	require.NoError(err)

	_, tx, _, err := cli.GenerateTransaction(
		context.Background(),
		parser,
		[]chain.Action{&action},
		ed25519AuthFactories[0],
	)
	require.NoError(err)

	txID, err := cli.SubmitTx(context.Background(), tx.Bytes())
	require.NoError(err)

	t.Logf("submitted tx: %s", txID)
	t.Log("querying indexer for tx...")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	indexerCli := indexer.NewClient(uri)
	_, _, err = indexerCli.WaitForTransaction(ctx, txCheckInterval, txID)
	if err != nil {
		t.Log("error waiting for tx:", err)
	}

	t.Log("now calling indexer.GetTx()")

	// Get TX and print
	_, ok, err := indexerCli.GetTx(context.Background(), txID)
	require.NoError(err)
	require.True(ok)
}
