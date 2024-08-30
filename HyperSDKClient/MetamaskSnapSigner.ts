import { base58 } from '@scure/base';
import MetaMaskSDK, { SDKProvider } from "@metamask/sdk";
import { TransactionPayload } from "sample-metamask-snap-for-hypersdk/src/sign";
import { SignerIface } from "./types";

import snapPkgJson from "sample-metamask-snap-for-hypersdk/package.json";
export const DEFAULT_SNAP_ID = `npm:${snapPkgJson.name}`;

type InvokeSnapParams = {
    method: string;
    params?: Record<string, unknown>;
};

let cachedProvider: SDKProvider | null = null;
async function getProvider(): Promise<SDKProvider> {
    if (!cachedProvider) {
        const metamaskSDK = new MetaMaskSDK();
        await metamaskSDK.connect();
        const provider = metamaskSDK.getProvider();
        if (!provider) {
            throw new Error("Failed to get provider");
        }
        cachedProvider = provider;
    }
    return cachedProvider;
}

export class MetamaskSnapSigner implements SignerIface {
    private cachedPublicKey: Uint8Array | null = null;

    constructor(private snapId: string, private lastDerivationSection: number = 0, private useLocalSnap: boolean = false) {

    }

    getPublicKey(): Uint8Array {
        if (!this.cachedPublicKey) {
            throw new Error("Public key not cached. Please call connect() first.");
        }
        return this.cachedPublicKey;
    }

    async signTx(txPayload: TransactionPayload, abiString: string): Promise<Uint8Array> {
        const sig58 = await this._invokeSnap({
            method: 'signTransaction', params: {
                derivationPath: [`${this.lastDerivationSection}'`],
                abiString: abiString,
                tx: txPayload,
            }
        }) as string | undefined;
        if (!sig58) {
            throw new Error("Failed to sign transaction");
        }
        return base58.decode(sig58);
    }

    async connect() {
        const provider = await getProvider();

        const providerVersion = (await provider?.request({ method: "web3_clientVersion" })) as string || "";
        if (!providerVersion.includes("flask")) {
            throw new Error("Your client is not compatible with development snaps. Please install MetaMask Flask!");
        }

        const snaps = (await provider.request({
            method: 'wallet_getSnaps',
        })) as Record<string, unknown>;

        if (!Object.keys(snaps).includes(this.snapId) || this.useLocalSnap) {
            await this.reinstallSnap();
        }

        const pubKey = await this._invokeSnap({
            method: 'getPublicKey',
            params: {
                derivationPath: [`${this.lastDerivationSection}'`]
            }
        }) as string | undefined;

        if (!pubKey) {
            throw new Error("Failed to get public key");
        }

        this.cachedPublicKey = base58.decode(pubKey);
    }

    async reinstallSnap() {
        const provider = await getProvider();

        console.log('Installing snap...');
        await provider.request({
            method: 'wallet_requestSnaps',
            params: {
                [this.snapId]: {},
            },
        });
        console.log('Snap installed');

        const snaps = (await provider.request({
            method: 'wallet_getSnaps',
        })) as Record<string, unknown>;

        if (Object.keys(snaps).includes(this.snapId)) {
            console.log('Snap installed successfully');
        } else {
            console.error('Snap not installed');
            throw new Error('Failed to install snap');
        }
    }

    private async _invokeSnap({ method, params }: InvokeSnapParams): Promise<unknown> {
        const provider = await getProvider();
        return await provider.request({
            method: 'wallet_invokeSnap',
            params: {
                snapId: this.snapId,
                request: params ? { method, params } : { method },
            },
        });
    }
}
