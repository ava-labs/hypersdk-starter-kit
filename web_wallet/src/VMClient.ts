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
