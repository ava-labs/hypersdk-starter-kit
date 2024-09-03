import { base64 } from '@scure/base';
import { SignerIface } from './types';
import { EphemeralSigner } from './EphemeralSigner';
import { PrivateKeySigner } from './PrivateKeySigner';
import { DEFAULT_SNAP_ID, MetamaskSnapSigner } from './MetamaskSnapSigner';
import { idStringToBigInt } from 'sample-metamask-snap-for-hypersdk/src/cb58'

//FIXME: we don't have a fee prediction yet, so we just use a huge number
const MAX_TX_FEE_TEMP = 10000000n

interface ApiResponse<T> {
    result: T;
    error?: {
        message: string;
    };
}

type signerParams = {
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

export abstract class HyperSDKBaseClient extends EventTarget {
    constructor(
        protected readonly apiHost: string,//for example: http://localhost:9650
        protected readonly vmName: string,//for example: hypervm
        protected readonly vmRPCPrefix: string,//for example: hyperapi
        protected readonly decimals: number = 9,
    ) {
        super();
        if (this.vmRPCPrefix.startsWith('/')) {
            this.vmRPCPrefix = vmRPCPrefix.substring(1);
        }
    }

    //public methods

    public async generatePayload(actions: ActionData[]): TransactionPayload {
        const chainIdStr = (await this.getNetwork()).chainId
        const chainIdBigNumber = idStringToBigInt(chainIdStr)

        return {
            timestamp: String(BigInt(Date.now()) + 59n * 1000n),
            chainId: String(chainIdBigNumber),
            maxFee: String(MAX_TX_FEE_TEMP),
            actions: actions
        }
    }

    private getNetworkCache: { networkId: number, subnetId: string, chainId: string } | null = null;
    public async getNetwork(): Promise<{ networkId: number, subnetId: string, chainId: string }> {
        if (!this.getNetworkCache) {
            this.getNetworkCache = await this.makeCoreAPIRequest<{ networkId: number, subnetId: string, chainId: string }>('network');
        }
        return this.getNetworkCache;
    }

    private abiCache: string | null = null;
    public async getAbi(): Promise<string> {
        if (!this.abiCache) {
            this.abiCache = (await this.makeCoreAPIRequest<{ abi: string }>('getABI')).abi
        }
        return this.abiCache;
    }

    public async sendTx(actions: ActionData[]): Promise<void> {
        const txPayload = await this.generatePayload(actions);
        const abiString = await this.getAbi();
        const signer = this.getSigner();
        const signed = await signer.signTx(txPayload, abiString);
        return this.sendRawTx(signed);
    }

    public async sendRawTx(txBytes: Uint8Array): Promise<void> {
        const bytesBase64 = base64.encode(txBytes);
        return this.makeCoreAPIRequest<void>('submitTx', { tx: bytesBase64 });
    }

    private signer: SignerIface | null = null;
    public async connect(params: signerParams): Promise<SignerIface> {
        if (params.type === "ephemeral") {
            this.signer = new EphemeralSigner();
        } else if (params.type === "private-key") {
            this.signer = new PrivateKeySigner(params.privateKey);
        } else if (params.type === "metamask-snap") {
            this.signer = new MetamaskSnapSigner(params.snapId ?? DEFAULT_SNAP_ID, params.lastDerivationSection ?? 0, params.useLocalSnap ?? false);
        } else {
            throw new Error(`Invalid signer type: ${(params as { type: string }).type}`);
        }

        await this.signer.connect();
        this.dispatchEvent(new CustomEvent('signerConnected', { detail: this.signer }));
        return this.signer;
    }

    public getSigner(): SignerIface {
        if (!this.signer) {
            throw new Error("Signer not connected");
        }
        return this.signer;
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
