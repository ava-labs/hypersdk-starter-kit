
import { TransactionPayload } from "sample-metamask-snap-for-hypersdk/src/sign"

export interface SignerIface {
    signTx(txPayload: TransactionPayload, abiString: string): Promise<Uint8Array>
    getPublicKey(): Uint8Array
    connect(): Promise<void>
}
