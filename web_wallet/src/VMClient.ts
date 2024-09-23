import { API_HOST, FAUCET_HOST } from "./const";
import { HyperSDKBaseClient } from "hypersdk-client/src/client"
import { ActionData } from 'hypersdk-client/src/snap'



class VMClient extends HyperSDKBaseClient {
    public readonly COIN_SYMBOL = 'CVM';
    public readonly TOKEN_ADDRESS = "039dd909c6fac1072001b309003837e26150eb2bf3be281c35f3ea3dc861e22dcd";

    constructor(apiHost: string, private readonly faucetHost: string) {
        const vmName = 'CFMMVM';
        const vmRPCPrefix = 'cfmmapi';
        const decimals = 9;
        super(apiHost, vmName, vmRPCPrefix, decimals);
    }

    public async getBalance(address: string): Promise<bigint> {
        const result = await this.makeVmAPIRequest<{ amount: number }>('balance', { address });
        return BigInt(result.amount)//FIXME: might be some loss of precision here
    }

    public async getTokenBalance(address: string, tokenAddress: string): Promise<string> {
       const payload: ActionData = {
              actionName: 'GetTokenAccountBalance',
              data: {
                token: tokenAddress,
                account: address,
              }
         }
         const res = await this.executeReadonlyAction(payload) as { balance: number }
         console.log(res)
         return res.balance.toString()

    }

    public async getTokenAddress(name: string, symbol: string, metadata: string): Promise<string> {
        const payload: ActionData = {
            actionName: 'GetTokenAddress',
            data: {
                name: btoa(name),
                symbol: btoa(symbol),
                metadata: btoa(metadata),
            }
        }
        const res = await this.executeReadonlyAction(payload) as { address: string }
        console.log(res)
        return res.address
    }

    async requestFaucetTransfer(address: string): Promise<void> {
        const response = await fetch(`${this.faucetHost}/faucet/${address}`, {
            method: 'POST',
            body: JSON.stringify({})
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    }

    public newTransferAction(to: string, amountString: string): ActionData {
        return {
            actionName: 'TransferToken',
            data: {
                to,
                tokenAddress: this.TOKEN_ADDRESS,
                value: this.fromFormattedBalance(amountString).toString(),
            },
        }
    }

    public NewTokenAction(name: string, symbol: string, metadata: string): ActionData {
        return {
            actionName: 'CreateToken',
            data: {
                name: btoa(name),
                symbol: btoa(symbol),
                metadata: btoa(metadata),
            }
        }
    }

    public NewTokenInfoAction(tokenAddress: string): ActionData {
        return {
            actionName: 'GetTokenInfo',
            data: {
                token: tokenAddress,
            }
        }
    }

    public MintTokenAction(to: string, value: number, token: string): ActionData {
        return {
            actionName: 'MintToken',
            data: {
                to,
                value:  value,
                token: token,
            }
        }
    }
}

export const vmClient = new VMClient(API_HOST, FAUCET_HOST);