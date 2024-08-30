import { base64 } from '@scure/base';
import { SignerIface } from './types';
import { EphemeralSigner } from './EphemeralSigner';
import { PrivateKeySigner } from './PrivateKeySigner';
import { DEFAULT_SNAP_ID, MetamaskSnapSigner } from './MetamaskSnapSigner';

interface ApiResponse<T> {
    result: T;
    error?: {
        message: string;
    };
}

type getSignerParams = {
    type: "ephemeral"
} | {
    type: "private-key",
    privateKey: Uint8Array
} | {
    type: "metamask-snap",
    snapId?: string,
    lastDerivationSection?: number,
    useLocalSnap?: boolean
}

export abstract class HyperSDKBaseClient {
    constructor(
        protected readonly apiHost: string,//for example: http://localhost:9650
        protected readonly vmName: string,//for example: morpheusvm
        protected readonly vmRPCPrefix: string,//for example: morpheusapi
        protected readonly decimals: number = 9,
    ) {
        if (this.vmRPCPrefix.startsWith('/')) {
            this.vmRPCPrefix = vmRPCPrefix.substring(1);
        }
    }

    //public methods
    public getNetwork(): Promise<{ networkId: number, subnetId: string, chainId: string }> {
        return this.makeCoreAPIRequest<{ networkId: number, subnetId: string, chainId: string }>('network');
    }

    public async getAbi(): Promise<string> {
        return (await this.makeCoreAPIRequest<{ abi: string }>('getABI')).abi
    }

    public async sendTx(txBytes: Uint8Array): Promise<void> {
        const bytesBase64 = base64.encode(txBytes);
        return this.makeCoreAPIRequest<void>('submitTx', { tx: bytesBase64 });
    }

    public async getSigner(params: getSignerParams): Promise<SignerIface> {
        let signer: SignerIface;
        if (params.type === "ephemeral") {
            signer = new EphemeralSigner();
        } else if (params.type === "private-key") {
            signer = new PrivateKeySigner(params.privateKey);
        } else if (params.type === "metamask-snap") {
            signer = new MetamaskSnapSigner(params.snapId ?? DEFAULT_SNAP_ID, params.lastDerivationSection ?? 0, params.useLocalSnap ?? false);
        } else {
            throw new Error("Invalid signer type");
        }

        await signer.connect();
        return signer;
    }


    public fromFormattedBalance = (balance: string): bigint => {
        const float = parseFloat(balance)
        return BigInt(float * 10 ** this.decimals)
    }

    public formatBalance = (balance: bigint): string => {
        const divisor = 10n ** BigInt(this.decimals);
        const quotient = balance / divisor;
        const remainder = balance % divisor;
        const paddedRemainder = remainder.toString().padStart(this.decimals, '0');
        return `${quotient}.${paddedRemainder}`;
    }

    //protected methods intended to be used by subclasses
    protected async makeCoreAPIRequest<T>(method: string, params: object = {}): Promise<T> {
        return this.makeApiRequest("coreapi", `hypersdk.${method}`, params);
    }

    protected async makeVmAPIRequest<T>(method: string, params: object = {}): Promise<T> {
        return this.makeApiRequest(this.vmRPCPrefix, `${this.vmName}.${method}`, params);
    }

    //private methods
    private async makeApiRequest<T>(namespace: string, method: string, params: object = {}): Promise<T> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        try {
            const response = await fetch(`${this.apiHost}/ext/bc/${this.vmName}/${namespace}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    method,
                    params,
                    id: parseInt(String(Math.random()).slice(2))
                }),
                signal: controller.signal
            });

            const json: ApiResponse<T> = await response.json();
            if (json?.error?.message) {
                throw new Error(json.error.message);
            }
            return json.result;
        } catch (error: unknown) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Request timed out after 3 seconds');
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }
}
