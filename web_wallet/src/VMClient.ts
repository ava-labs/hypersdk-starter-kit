import { API_HOST, FAUCET_HOST } from "./const";
import { HyperSDKBaseClient } from "hypersdk-client/src/client"
import { ActionData } from 'hypersdk-client/src/snap'

class VMClient extends HyperSDKBaseClient {
    public readonly COIN_SYMBOL = 'CVM';
    
    constructor(apiHost: string, private readonly faucetHost: string) {
        const vmName = 'CFMMVM';
        const vmRPCPrefix = 'cfmmapi';
        const decimals = 18;
        super(apiHost, vmName, vmRPCPrefix, decimals);
    }        

    //broken for now
    async requestFaucetTransfer(address: string): Promise<void> {
        const response = await fetch(`${this.faucetHost}/faucet/${address}`, {
            method: 'POST',
            body: JSON.stringify({})
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    }

    async getNativeTokenAddress(): Promise<string> {
        const address = await this.makeVmAPIRequest('native_token_address', {}) as unknown as string;
        console.log(address)
        return address;
    }

    public newGetTokenAccountBalanceAction(tokenAddress: string, address: string): ActionData {
        return {
            actionName: 'GetTokenAccountBalance',
            data: {
                tokenAddress,
                address
            },
        }
    }

    public newCreateTokenAction(name: string, symbol: string, metadata: string): ActionData {
        return {
            actionName: 'CreateToken',
            data: {
               name,
               symbol,
               metadata
            },
        }
    }

    public newMintTokenAction(to: string, value: number, tokenAddress: string): ActionData {
        return {
            actionName: 'MintToken',
            data: {
                to,
                value,
                tokenAddress
            },
        }
    }

    public newTransferTokenAction(to: string, tokenAddress: string, value: string): ActionData {
        return {
            actionName: 'TransferToken',
            data: {
                to,
                tokenAddress,
                value
            },
        }
    }

    public newGetTokenInfoAction(tokenAddress: string): ActionData {
        return {
            actionName: 'GetTokenInfo',
            data: {
               tokenAddress
            },
        }
    }

}

export const vmClient = new VMClient(API_HOST, FAUCET_HOST);
