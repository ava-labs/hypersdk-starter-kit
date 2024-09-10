package main

import (
	"encoding/hex"
	"fmt"

	"github.com/ava-labs/hypersdk-starter/vm/consts"
	"github.com/ava-labs/hypersdk/auth"
	"github.com/ava-labs/hypersdk/codec"
	"github.com/ava-labs/hypersdk/crypto/ed25519"
)

func main() {
	priv, err := ed25519.GeneratePrivateKey()
	if err != nil {
		panic(err)
	}

	pub := priv.PublicKey()
	addrStr := codec.MustAddressBech32(consts.HRP, auth.NewED25519Address(pub))

	fmt.Println(hex.EncodeToString(priv[:]))
	fmt.Println(addrStr)
}
