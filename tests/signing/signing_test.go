package signing

import (
	"encoding/hex"
	"math"
	"testing"

	"github.com/ava-labs/avalanchego/ids"
	"github.com/ava-labs/hypersdk-starter/actions"
	"github.com/ava-labs/hypersdk-starter/vm"
	"github.com/ava-labs/hypersdk/auth"
	"github.com/ava-labs/hypersdk/chain"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/consts"
	"github.com/ava-labs/hypersdk/crypto/ed25519"
	"github.com/stretchr/testify/require"
)

const expectedBase = "0000018fcbcdeef0d36e467c73e2840140cc41b3d72f8a5a7446b2399c39b9c74d4cf077d250902400000002540be400"

func TestSigningEmptyTx(t *testing.T) {
	require := require.New(t)

	chainID, err := ids.FromString("2c7iUW3kCDwRA9ZFd5bjZZc8iDy68uAsFSBahjqSZGttiTDSNH")
	require.NoError(err)

	base := &chain.Base{
		ChainID:   chainID,
		Timestamp: 1717111222000,
		MaxFee:    uint64(10 * math.Pow(10, 9)),
	}

	tx := chain.NewTx(base, []chain.Action{})

	digest, err := tx.Digest()
	require.NoError(err)

	baseBytes := marshalBase(t, base)
	require.Equal(expectedBase, hex.EncodeToString(baseBytes))

	expected := expectedBase + "00" // 00 is the length of the actions
	require.Equal(expected, hex.EncodeToString(digest))
}

func marshalBase(t *testing.T, base *chain.Base) []byte {
	require := require.New(t)

	basePacker := codec.NewWriter(0, consts.NetworkSizeLimit)
	base.Marshal(basePacker)
	require.NoError(basePacker.Err())

	return basePacker.Bytes()
}

func TestSigningSingleActionTx(t *testing.T) {
	require := require.New(t)

	chainID, err := ids.FromString("2c7iUW3kCDwRA9ZFd5bjZZc8iDy68uAsFSBahjqSZGttiTDSNH")
	require.NoError(err)

	addrBytes, err := hex.DecodeString("0102030405060708090a0b0c0d0e0f101112131400000000000000000000000000")
	require.NoError(err)
	var addr codec.Address
	copy(addr[:], addrBytes)

	action := &actions.Transfer{
		To:    addr,
		Value: 1000,
		Memo:  []byte("hi"),
	}

	tx := chain.NewTx(
		&chain.Base{
			ChainID:   chainID,
			Timestamp: 1717111222000,
			MaxFee:    uint64(10 * math.Pow(10, 9)),
		},
		[]chain.Action{action},
	)

	digest, err := tx.Digest()
	require.NoError(err)

	expected := expectedBase +
		"01" + //how many actions
		"00" + //action id
		"0102030405060708090a0b0c0d0e0f101112131400000000000000000000000000" + //to
		"00000000000003e8" + //value
		"000000026869" //memo

	require.Equal("0000018fcbcdeef0d36e467c73e2840140cc41b3d72f8a5a7446b2399c39b9c74d4cf077d250902400000002540be40001000102030405060708090a0b0c0d0e0f10111213140000000000000000000000000000000000000003e8000000026869", hex.EncodeToString(digest))
	require.Equal(expected, hex.EncodeToString(digest))

	privateKeyHex := "323b1d8f4eed5f0da9da93071b034f2dce9d2d22692c172f3cb252a64ddfafd01b057de320297c29ad0c1f589ea216869cf1938d88c9fbd70d6748323dbf2fa7"
	privateKeyBytes, err := hex.DecodeString(privateKeyHex)
	require.NoError(err)
	privateKey := ed25519.PrivateKey(privateKeyBytes[:ed25519.PrivateKeyLen])

	factory := auth.NewED25519Factory(privateKey)
	signedTx, err := tx.Sign(factory, vm.ActionParser, vm.AuthParser)
	require.NoError(err)

	signedTxBytes := signedTx.Bytes()
	require.NoError(err)

	expectedSignedTx := "0000018fcbcdeef0d36e467c73e2840140cc41b3d72f8a5a7446b2399c39b9c74d4cf077d250902400000002540be40001000102030405060708090a0b0c0d0e0f10111213140000000000000000000000000000000000000003e8000000026869001b057de320297c29ad0c1f589ea216869cf1938d88c9fbd70d6748323dbf2fa7b86baec5fe89f2bb585cb781f694a398107fe760577c750da3e9b381c5f5a3673c4a85c65a0db8d5ed03b4c4fd7f818d99270504e65c0ebf4d73884e0bfce60a"
	require.Equal(expectedSignedTx, hex.EncodeToString(signedTxBytes))
}
