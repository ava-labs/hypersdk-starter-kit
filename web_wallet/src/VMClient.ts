import { ActionData } from "hypersdk-client/src/snap";
import { API_HOST, DECIMALS, FAUCET_HOST, VM_NAME, VM_RPC_PREFIX } from "./const";
import { HyperSDKClient } from "hypersdk-client/src/client"

export const vmClient = new HyperSDKClient(API_HOST, VM_NAME, VM_RPC_PREFIX, DECIMALS);

export async function requestFaucetTransfer(address: string): Promise<void> {
    const response = await fetch(`${FAUCET_HOST}/faucet/${address}`, {
        method: 'POST',
        body: JSON.stringify({})
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
}

export const NewTransferAction = (to: string, tokenAddress: string, value: string): ActionData => {
    return {
        actionName: "TransferToken",
        data: {
            to,
            tokenAddress,
            value: vmClient.fromFormattedBalance(value).toString()
        }
    }
}

export const NewTokenBalanceAction = (tokenAddress: string, address: string): ActionData => {
    return {
        actionName: "GetTokenAccountBalance",
        data: {
            tokenAddress,
            address
        }
    }
}

export const NewTokenInfoAction = (token: string): ActionData => {
    return {
        actionName: "GetTokenInfo",
        data: {
            token
        }
    }
}

export const NewCreateTokenAction = (name: string, symbol: string, metadata: string): ActionData => {
    return {
        actionName: "CreateToken",
        data: {
            name: btoa(name),
            symbol: btoa(symbol),
            metadata: btoa(metadata)
        }
    }
}

export const NewMintTokenAction = (to: string, value: string, token: string): ActionData => {
    return {
        actionName: "MintToken",
        data: {
            to,
            value: vmClient.fromFormattedBalance(value).toString(),
            token
        }
    }
}
// type MintToken struct {
// 	To    codec.Address `serialize:"true" json:"to"`
// 	Value uint64        `serialize:"true" json:"value"`
// 	Token codec.Address `serialize:"true" json:"token"`
// }