import { Marshaler } from "sample-metamask-snap-for-hypersdk/src/Marshaler";
import { SignerIface } from "./types";
import { TransactionPayload, signTransactionBytes } from "sample-metamask-snap-for-hypersdk/src/sign"
import { ed25519 } from "@noble/curves/ed25519";

export class PrivateKeySigner implements SignerIface {
    constructor(private privateKey: Uint8Array) {
        if (this.privateKey.length !== 32) {
            throw new Error("Private key must be 32 bytes");
        }
    }

    async signTx(txPayload: TransactionPayload, abiString: string): Promise<Uint8Array> {
        const marshaler = new Marshaler(abiString);
        const digest = marshaler.encodeTransaction(txPayload);
        const signedTxBytes = signTransactionBytes(digest, this.privateKey);
        return signedTxBytes;
    }

    getPublicKey(): Uint8Array {
        return ed25519.getPublicKey(this.privateKey);
    }

    async connect(): Promise<void> {
        // No-op
    }
}
