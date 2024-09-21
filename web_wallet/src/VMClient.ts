import { API_HOST, FAUCET_HOST } from "./const";
import { HyperSDKBaseClient } from "hypersdk-client/src/client"
import { ActionData } from 'hypersdk-client/src/snap'

class VMClient extends HyperSDKBaseClient {
    public readonly COIN_SYMBOL = 'CVM';
    public readonly TOKEN_ADDRESS = "039dd909c6fac1072001b309003837e26150eb2bf3be281c35f3ea3dc861e22dcd";

    constructor(apiHost: string, private readonly faucetHost: string) {
        const vmName = 'CFMMVM';
        const vmRPCPrefix = 'cfmmapi';
        const decimals = 18;
        super(apiHost, vmName, vmRPCPrefix, decimals);
    }        

    public async getBalance(address: string): Promise<bigint> {
        const payload: ActionData = {
            actionName: "GetTokenAccountBalance",
            data: { 
                balance: vmClient.TOKEN_ADDRESS, // should be the token address, balance naming is wrong
                account: address 
            }
        }
        const result = await this.executeReadonlyAction(payload) as { balance: number };
        return BigInt(result.balance);
    }

    public async getTokenInfo(address: string): Promise<{ name: string, symbol: string, metadata: string, supply: bigint, owner: string }> {
        const payload: ActionData = {
            actionName: "GetTokenInfo",
            data: { 
                token: address 
            }
        }
        const result = await this.executeReadonlyAction(payload) as { name: string, symbol: string, metadata: string, supply: number, owner: string };
        console.log(result)
        return {
            name: result.name,
            symbol: result.symbol,
            metadata: result.metadata,
            supply: BigInt(result.supply),
            owner: result.owner
        };
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
}

export const vmClient = new VMClient(API_HOST, FAUCET_HOST);
