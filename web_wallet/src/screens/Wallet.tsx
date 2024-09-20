import { useState, useCallback, useEffect } from 'react'
import { vmClient } from '../VMClient'

export default function Wallet({ myAddr }: { myAddr: string }) {
    const [balance, setBalance] = useState(0n)

    const fetchBalance = useCallback(async () => {
        try {
            const balance = await vmClient.getBalance(myAddr)
            setBalance(balance)
        } catch (e) {
            console.error("Failed to fetch balance:", e)
        }
    }, [myAddr]);

    useEffect(() => {
        fetchBalance()
    }, [fetchBalance])

    return (
        <div className="w-full bg-white p-8">
            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Address:</h2>
                <div className="text-md font-mono break-all bg-gray-100 p-3 rounded">{myAddr}</div>
            </div>
            <div>
                <h2 className="text-lg font-semibold mb-2">Balance:</h2>
                <div className="text-4xl font-bold">
                    {parseFloat(vmClient.formatBalance(balance)).toFixed(6)} {vmClient.COIN_SYMBOL}
                </div>
            </div>
        </div>
    )
}
