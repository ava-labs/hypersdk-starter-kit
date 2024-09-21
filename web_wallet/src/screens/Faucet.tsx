import React, { useState, useEffect } from 'react'
import { vmClient } from '../VMClient'

interface FaucetProps {
    minBalance: bigint
    children: React.ReactNode
    myAddr: string
}

export default function Faucet({ children, minBalance, myAddr }: FaucetProps) {
    const [loading, setLoading] = useState(0)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (myAddr === "") {
            return
        }

        async function performFaucetRequest() {
            setLoading(l => l + 1)
            try {
                const initialBalance = await vmClient.getBalance(myAddr) // need to fetch native token address
    
                if (initialBalance <= minBalance) {


                    //FIXME: remove this after issues with faucet are fixed
                    const maxAttempts = 10
                    for (let i = 0; i < maxAttempts; i++) {
                        try {
                            await vmClient.requestFaucetTransfer(myAddr)
                            break
                        } catch (e) {
                            console.log(`Error requesting faucet transfer: ${(e instanceof Error && e.message) ? e.message : String(e)}`)
                            if (i === maxAttempts - 1) {
                                throw e
                            }
                            await new Promise(resolve => setTimeout(resolve, i * 100))
                        }
                    }

                    for (let i = 0; i < 100; i++) {
                        const balance = await vmClient.getBalance(myAddr)
                        if (balance !== minBalance) {
                            console.log(`Balance is ${balance}, changed from ${minBalance}`)
                            break
                        }
                        await new Promise(resolve => setTimeout(resolve, 100))
                    }
                }
            } catch (e) {
                setError((e instanceof Error && e.message) ? e.message : String(e))
            } finally {
                setLoading(l => l - 1)
            }
        }

        performFaucetRequest()
    }, [myAddr, minBalance])

    if (loading) {
        return <div>Requesting faucet funds...</div>
    }

    if (error) {
        return <div>Error: {error}</div>
    }

    return <>{children}</>
}
