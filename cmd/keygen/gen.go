package main

import (
	"encoding/hex"
	"fmt"
	"os"

	"github.com/ava-labs/hypersdk/auth"
	"github.com/ava-labs/hypersdk/crypto/ed25519"
	"github.com/joho/godotenv"
)

func main() {
	priv, err := ed25519.GeneratePrivateKey()
	if err != nil {
		panic(err)
	}

	pub := priv.PublicKey()
	addrStr := auth.NewED25519Address(pub).String()

	privKeyHex := hex.EncodeToString(priv[:])

	// Check if .env file exists, if not copy from .env.example
	if _, err := os.Stat(".env"); os.IsNotExist(err) {
		err = copyFile(".env.example", ".env")
		if err != nil {
			panic(err)
		}
		fmt.Println(".env file created from .env.example")
	}

	// Load existing .env file
	envMap, err := godotenv.Read(".env")
	if err != nil {
		panic(err)
	}

	// Always update FAUCET_PRIVATE_KEY_HEX and PREFUND_ADDRESS
	envMap["FAUCET_PRIVATE_KEY_HEX"] = privKeyHex
	envMap["PREFUND_ADDRESS"] = addrStr

	// Write to .env file
	err = godotenv.Write(envMap, ".env")
	if err != nil {
		panic(err)
	}

	fmt.Println("Private key and address have been written to .env file")
}

func copyFile(src, dst string) error {
	input, err := os.ReadFile(src)
	if err != nil {
		return err
	}

	err = os.WriteFile(dst, input, 0644)
	if err != nil {
		return err
	}

	return nil
}
