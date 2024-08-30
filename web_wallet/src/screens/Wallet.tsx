
import { ArrowPathIcon } from '@heroicons/react/20/solid'
import { pubKeyToED25519Addr } from 'sample-metamask-snap-for-hypersdk/src/bech32'
import { idStringToBigInt } from 'sample-metamask-snap-for-hypersdk/src/cb58'
import { useState } from 'react'
import { base64 } from '@scure/base'
import { ActionData, TransactionPayload } from 'sample-metamask-snap-for-hypersdk/src/sign'
import { SignerIface } from '../lib/signers'
import { morpheusClient } from '../lib/MorpheusClient'

//FIXME: we don't have a fee prediction yet, so we just use a big number
const MAX_TX_FEE_TEMP = 10000000n

export default function Wallet({ otherWalletAddress, signer, balanceBigNumber, onBalanceRefreshRequested, walletName, derivationPath }: { otherWalletAddress: string, signer: SignerIface, balanceBigNumber: bigint, onBalanceRefreshRequested: () => void, walletName: string, derivationPath: string }) {
    const myAddr = pubKeyToED25519Addr(signer.getPublicKey(), morpheusClient.HRP)

    const [loadingCounter, setLoadingCounter] = useState(0)
    const [logText, setLogText] = useState("")

    function log(level: "success" | "error" | "info", text: string) {
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { hour12: false });
        let emoji = '';
        emoji = level === 'success' ? '✅' : level === 'error' ? '❌' : 'ℹ️';
        setLogText(prevLog => `${prevLog}\n${time} ${emoji} ${text}`);
    }

    async function sendTokens(amountString: "0.1" | "1") {
        setLogText("")
        try {
            log("info", `Sending ${amountString} ${morpheusClient.COIN_SYMBOL} to ${otherWalletAddress}`)
            setLoadingCounter(counter => counter + 1)
            const amount = morpheusClient.fromFormattedBalance(amountString)
            const initialBalance = await morpheusClient.getBalance(myAddr)


            log("info", `Initial balance: ${morpheusClient.formatBalance(initialBalance)} ${morpheusClient.COIN_SYMBOL}`)


            const chainIdStr = (await morpheusClient.getNetwork()).chainId
            const chainIdBigNumber = idStringToBigInt(chainIdStr)

            const actionData: ActionData = {
                data: {
                    to: otherWalletAddress,
                    value: String(amount),
                    memo: base64.encode(new TextEncoder().encode("Hey there!")),
                },
                actionName: "Transfer",
            }

            const txPayload: TransactionPayload = {
                timestamp: String(BigInt(Date.now()) + 59n * 1000n),
                chainId: String(chainIdBigNumber),
                maxFee: String(MAX_TX_FEE_TEMP),
                actions: [actionData]
            }

            const abiString = await morpheusClient.getAbi()

            const signed = await signer.signTx(txPayload, abiString)

            log("success", `Transaction signed`)

            await morpheusClient.sendTx(signed)
            log("success", `Transaction sent, waiting for the balance change`)


            let balanceChanged = false
            const totalWaitTime = 15 * 1000
            const timeStarted = Date.now()

            for (let i = 0; i < 100000; i++) {//curcuit breaker
                const balance = await morpheusClient.getBalance(myAddr)
                if (balance !== initialBalance || Date.now() - timeStarted > totalWaitTime) {
                    balanceChanged = true
                    log("success", `Balance changed to ${parseFloat(morpheusClient.formatBalance(balance)).toFixed(6)} ${morpheusClient.COIN_SYMBOL} in ${((Date.now() - timeStarted) / 1000).toFixed(2)}s`)
                    break
                } else {
                    await new Promise(resolve => setTimeout(resolve, 100))
                }
            }

            if (!balanceChanged) {
                throw new Error("Transaction failed")
            }

            console.log("Transaction successful")


            await onBalanceRefreshRequested()
        } catch (e: unknown) {
            log("error", `Transaction failed: ${(e as { message?: string })?.message || String(e)}`);
            console.error(e)
        } finally {
            setLoadingCounter(counter => counter - 1)
        }
    }

    return (<div className={loadingCounter > 0 ? "animate-pulse" : ""}>
        <h1 className="text-3xl font-bold">{walletName}</h1>
        <div className="text-xs mb-4">Derivation path {derivationPath}</div>
        <div className="text-xl font-mono break-all ">{myAddr}</div>
        <div className="flex items-center my-12">
            <div className='text-8xl font-bold'>{parseFloat(morpheusClient.formatBalance(balanceBigNumber)).toFixed(6)} {morpheusClient.COIN_SYMBOL}</div>
            <button className="ml-4" onClick={() => onBalanceRefreshRequested()}>
                <ArrowPathIcon className="h-6 w-6 text-gray-500 hover:text-gray-700" />
            </button>
        </div>
        <div className="flex space-x-4">
            <button className={`px-4 py-2 font-bold rounded transition-colors duration-200 ${loadingCounter > 0 ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800 transform hover:scale-105'}`}
                onClick={() => sendTokens("0.1")}
                disabled={loadingCounter > 0}
            >
                Send 0.1 RED
            </button>
            <button className={`px-4 py-2 font-bold rounded border transition-colors duration-200 ${loadingCounter > 0 ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed' : 'bg-white text-black border-black hover:bg-gray-100 transform hover:scale-105'}`}
                onClick={() => sendTokens("1")}
                disabled={loadingCounter > 0}
            >
                Send 1 RED
            </button>
        </div>
        <div className="mt-8 border border-gray-300 rounded p-4 min-h-16">
            <pre className="font-mono text-sm">
                {logText}
            </pre>
        </div>
    </div>)
}
