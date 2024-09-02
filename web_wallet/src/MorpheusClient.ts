import { API_HOST, FAUCET_HOST } from "./const";
import { HyperSDKBaseClient } from "../../HyperSDKClient"
import { ActionData } from 'sample-metamask-snap-for-hypersdk/src/sign'
import { base64 } from '@scure/base'


class MorpheusClient extends HyperSDKBaseClient {
    public readonly COIN_SYMBOL = 'RED';
    public readonly HRP = 'morpheus'

    constructor(apiHost: string, private readonly faucetHost: string) {
        const vmName = 'morpheusvm';
        const vmRPCPrefix = 'morpheusapi';
        const decimals = 9;
        super(apiHost, vmName, vmRPCPrefix, decimals);
    }

    public async getBalance(address: string): Promise<bigint> {
        const result = await this.makeVmAPIRequest<{ amount: number }>('balance', { address });
        return BigInt(result.amount)//FIXME: might be some loss of precision here
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

    public newTransferAction(to: string, amountString: string, memo: string): ActionData {
        return {
            actionName: 'Transfer',
            data: {
                to,
                value: this.fromFormattedBalance(amountString),
                memo: base64.encode(new TextEncoder().encode(memo)),
            },
        }
    }
}

export const morpheusClient = new MorpheusClient(API_HOST, FAUCET_HOST);
