import { useState } from 'react'
import { vmClient } from '../VMClient'

export default function ConnectWallet() {
    const [loading, setLoading] = useState(0)
    const [errors, setErrors] = useState<string[]>([])

    async function connectWallet(signerType: "metamask-snap" | "ephemeral") {
        try {
            setLoading((prevLoading) => prevLoading + 1);
            if (signerType === "metamask-snap") {
                await vmClient.connect({ 
                    type: "metamask-snap",
                    // snapId: "local:http://localhost:8080"
                })
            } else {
                await vmClient.connect({ type: "ephemeral" })
            }
        } catch (e) {
            console.error(e);
            setErrors((prevErrors) => [...prevErrors, (e as Error)?.message || String(e)]);
        } finally {
            setLoading((prevLoading) => prevLoading - 1);
        }
    }

    if (loading > 0) {
        return (<div className="flex items-center justify-center min-h-screen">
            <div className="text-2xl font-bold">Please confirm the connection in Metamask Flask signer</div>
        </div>)
    }

    if (errors.length > 0) {
        return <div className="border border-black  p-6 rounded-lg max-w-md w-full ">
            <div className="text-lg font-bold  mb-4">Errors:</div>
            <ol className="text-lg list-disc pl-5 mb-5">
                {errors.map((error, index) => (
                    <li key={index} className="mb-2">{error}</li>
                ))}
            </ol>
            <button className="px-4 py-2 bg-black text-white font-bold rounded hover:bg-gray-800 transition-colors duration-200 transform hover:scale-105"
                onClick={() =>
                    window.location.reload()
                }>
                Start over
            </button>
        </div>
    }
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="border border-black px-16 py-12 rounded-lg max-w-xl w-full text-center">
                <h3 className="text-4xl font-semibold text-gray-900 mb-5 ">HyperSDK e2e demo</h3>
                <p className="mt-4 text-sm">Connect with Metamask Flask development signer via a Snap, or create a signer in memory.</p>
                <div className="mt-8 flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 sm:space-x-4">
                    <button
                        type="button"
                        className="w-48 px-4 py-2 bg-black text-white font-bold rounded hover:bg-gray-800 transition-colors duration-200 transform hover:scale-105"
                        onClick={() => connectWallet("metamask-snap")}
                    >
                        Metamask Snap
                    </button>
                    <button
                        type="button"
                        className="w-48 px-4 py-2 bg-white text-black font-bold rounded border border-black hover:bg-gray-100 transition-colors duration-200 transform hover:scale-105"
                        onClick={() => connectWallet("ephemeral")}
                    >
                        Temporary key
                    </button>
                </div>
            </div>
        </div>
    )
}
