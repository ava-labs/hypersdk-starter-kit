import { ArrowPathIcon } from '@heroicons/react/20/solid'
import { useState, useCallback, useEffect } from 'react'
import { ActionData } from 'hypersdk-client/src/snap'
import { vmClient } from '../VMClient'


const otherWalletAddress = "morpheus1qypqxqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqmrmag4"
export default function Wallet({ myAddr }: { myAddr: string }) {
    const [loading, setLoading] = useState(0)
    const [logText, setLogText] = useState("")
    const [balance, setBalance] = useState(0n)

    const log = useCallback((level: "success" | "error" | "info", text: string) => {
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { hour12: false });
        const emoji = level === 'success' ? '✅' : level === 'error' ? '❌' : 'ℹ️';
        setLogText(prevLog => `${prevLog}\n${time} ${emoji} ${text}`);
    }, []);

    const fetchBalance = useCallback(async () => {
        try {
            setLoading(l => l + 1)
            const balance = await vmClient.getBalance(myAddr)
            setBalance(balance)
        } catch (e) {
            log("error", `Failed to fetch balance: ${(e as { message?: string })?.message || String(e)}`);
        } finally {
            setLoading(l => l - 1)
        }
    }, [myAddr, log]);

    useEffect(() => {
        fetchBalance()
    }, [fetchBalance])

    async function sendTokens(amountString: "0.1" | "1") {
        setLogText("")
        try {
            log("info", `Sending ${amountString} ${vmClient.COIN_SYMBOL} to ${otherWalletAddress}`)
            setLoading(counter => counter + 1)
            const initialBalance = await vmClient.getBalance(myAddr)

            log("info", `Initial balance: ${vmClient.formatBalance(initialBalance)} ${vmClient.COIN_SYMBOL}`)

            const actionData: ActionData = vmClient.newTransferAction(otherWalletAddress, amountString, "test")
            await vmClient.sendTx([actionData])
            log("success", `Transaction sent, waiting for the balance change`)

            let balanceChanged = false
            const totalWaitTime = 15 * 1000
            const timeStarted = Date.now()

            for (let i = 0; i < 100000; i++) {
                const balance = await vmClient.getBalance(myAddr)
                if (balance !== initialBalance || Date.now() - timeStarted > totalWaitTime) {
                    balanceChanged = true
                    log("success", `Balance changed to ${parseFloat(vmClient.formatBalance(balance)).toFixed(6)} ${vmClient.COIN_SYMBOL} in ${((Date.now() - timeStarted) / 1000).toFixed(2)}s`)
                    break
                } else {
                    await new Promise(resolve => setTimeout(resolve, 100))
                }
            }

            if (!balanceChanged) {
                throw new Error("Transaction failed")
            }

            log("success", "Transaction successful")

            await fetchBalance()
        } catch (e: unknown) {
            log("error", `Transaction failed: ${(e as { message?: string })?.message || String(e)}`);
            console.error(e)
        } finally {
            setLoading(counter => counter - 1)
        }
    }

    return (
        <div className="w-full  bg-white p-8">
            <div className={loading > 0 ? "animate-pulse" : ""}>
                <div className="text-xl font-mono break-all ">{myAddr}</div>
                <div className="flex items-center my-12">
                    <div className='text-8xl font-bold'>{parseFloat(vmClient.formatBalance(balance)).toFixed(6)} {vmClient.COIN_SYMBOL}</div>
                    <button className="ml-4" onClick={() => fetchBalance()}>
                        <ArrowPathIcon className="h-6 w-6 text-gray-500 hover:text-gray-700" />
                    </button>
                </div>
                <div className="flex space-x-4">
                    <button className={`px-4 py-2 font-bold rounded transition-colors duration-200 ${loading > 0 ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800 transform hover:scale-105'}`}
                        onClick={() => sendTokens("0.1")}
                        disabled={loading > 0}
                    >
                        Send 0.1 RED
                    </button>
                    <button className={`px-4 py-2 font-bold rounded border transition-colors duration-200 ${loading > 0 ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed' : 'bg-white text-black border-black hover:bg-gray-100 transform hover:scale-105'}`}
                        onClick={() => sendTokens("1")}
                        disabled={loading > 0}
                    >
                        Send 1 RED
                    </button>

                </div>
                <div className="mt-8 border border-gray-300 rounded p-4 min-h-16">
                    <pre className="font-mono text-sm">
                        {logText}
                    </pre>
                </div>
            </div>
        </div>
    )
}
