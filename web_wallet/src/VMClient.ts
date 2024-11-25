import { API_HOST, FAUCET_HOST, VM_NAME, VM_RPC_PREFIX } from "./const";
import { HyperSDKClient } from "hypersdk-client/dist/"


export const vmClient = new HyperSDKClient(API_HOST, VM_NAME, VM_RPC_PREFIX);

export async function requestFaucetTransfer(address: string): Promise<void> {
    console.log('requestFaucetTransfer address: ', address);
    const response = await fetch(`${FAUCET_HOST}/faucet/${address}`, {
        method: 'POST',
        body: JSON.stringify({})
    });
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
}

export async function isFaucetReady(): Promise<boolean> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const response = await fetch(`${FAUCET_HOST}/readyz`, {
            method: 'GET',
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        return response.ok;
    } catch (error) {
        return false;
    }
}
