import { useEffect, useState } from 'react'
import { isFaucetReady, vmClient } from '../VMClient'
import { decodeAddress } from "hypersdk-client/src/Marshaler"

type SignerType = "metamask-snap" | "ephemeral" | "core";

const checkFlask = (clientVersion: string) => {
    return String(clientVersion).indexOf("flask") !== -1
}

export default function ConnectWallet() {
    const [loading, setLoading] = useState(0)
    const [errors, setErrors] = useState<string[]>([])
    const [isFlaskInstalled, setIsFlaskInstalled] = useState(false)
    const [isCoreInstalled, setIsCoreInstalled] = useState(false)


    useEffect(() => {
        const setCoreInstalled = async () => {
            if (window.ethereum?.coreProvider) {
                setIsCoreInstalled(true)
                return true
            }
            return false
        }
        const checkFlaskInstallation = async () => {


            if (window.ethereum) {
                if (await setCoreInstalled()) {
                    setIsFlaskInstalled(false);
                    return;
                }

                const clientVersion = await window.ethereum.request({ method: "web3_clientVersion" }) as string;
                if (checkFlask(clientVersion)) {
                    setIsFlaskInstalled(true)
                }
                else {
                    setIsFlaskInstalled(false);
                }
            } else {
                setIsFlaskInstalled(false);
            }
        };

        checkFlaskInstallation();
        setCoreInstalled()
    }, []);

    async function connectWallet(signerType: SignerType, snapSource: "npm" | "local" = "npm") {
        console.log('signerType: ', signerType);
        try {
            setLoading((prevLoading) => prevLoading + 1);
            if (signerType === "metamask-snap") {
                const snapId = snapSource === "local" ? "local:http://localhost:8989" : undefined;
                await vmClient.connectWallet({ type: "metamask-snap", snapId });
            }
            else if (signerType === "core") { 
                await vmClient.connectWallet({ type: "core"});
            } else {
                await vmClient.connectWallet({ type: "ephemeral" });
            }
        } catch (e) {
            console.error('connectWallet error: ', e);

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
            <div className="border border-black px-16 py-12 rounded-lg max-w-3xl w-full text-center">
                <h3 className="text-4xl font-semibold text-gray-900 mb-5 ">HyperSDK e2e demo</h3>
                <p className="mt-4 text-sm">Connect with Metamask Flask development signer via a Snap, or create a signer in memory.</p>
                <div className="mt-8 flex flex-col space-y-4">
                    <div className="flex flex-row justify-between space-x-4">
                        {!isCoreInstalled && <button
                            type="button"
                            className={`flex-1 px-4 py-2 ${isFlaskInstalled ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-600 cursor-not-allowed'} text-white font-semibold rounded transition-colors duration-200 transform ${isFlaskInstalled ? 'hover:scale-105' : ''}`}
                            onClick={() => isFlaskInstalled && connectWallet("metamask-snap", "npm")}
                            disabled={!isFlaskInstalled}
                        >
                            {isFlaskInstalled ? "Connect with Snap" : "No MetaMask Flask detected"}
                        </button>}
                        <button
                            type="button"
                            className={`flex-1 px-4 py-2 ${isCoreInstalled ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-600 cursor-not-allowed'} text-white font-semibold rounded transition-colors duration-200 transform ${isCoreInstalled ? 'hover:scale-105' : ''}`}
                            onClick={() => isCoreInstalled && connectWallet("core")}
                            disabled={!isCoreInstalled}
                        >
                            {isCoreInstalled ? "Connect with Core" : "No Core detected"}
                        </button>
                        <button
                            type="button"
                            className="flex-1 px-4 py-2 bg-gray-800 text-white font-semibold rounded hover:bg-gray-700 transition-colors duration-200 transform hover:scale-105"
                            onClick={() => connectWallet("ephemeral")}
                        >
                            Generate temp wallet
                        </button>
                    </div>
                </div>
                <div className="mt-8">
                    <IsReadyWidget />
                </div>
            </div>
        </div>
    )
}


function IsReadyWidget() {
    const [faucetStatus, setFaucetStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [vmApiStatus, setVmApiStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [coreApiStatus, setCoreApiStatus] = useState<'loading' | 'ready' | 'error'>('loading');

    useEffect(() => {
        const checkServices = async () => {
            // Check Faucet
            try {
                const faucetReady = await isFaucetReady();
                setFaucetStatus(faucetReady ? 'ready' : 'error');
            } catch {
                setFaucetStatus('error');
            }

            // Check VM API
            try {
                const [zeroAddr,] = decodeAddress(new Uint8Array(Array(33).fill(0)))
                await vmClient.getBalance(zeroAddr);
                setVmApiStatus('ready');
            } catch {
                setVmApiStatus('error');
            }

            // Check Core API
            try {
                await vmClient.getAbi();
                setCoreApiStatus('ready');
            } catch {
                setCoreApiStatus('error');
            }
        };

        checkServices();
    }, []);

    const getStatusWithEmoji = (item: string, status: 'loading' | 'ready' | 'error') => {
        switch (status) {
            case 'loading':
                return `⏳ checking ${item}...`;
            case 'ready':
                return `✅ ${item} is ready`;
            case 'error':
                return `❌ ${item} is not ready`;
        }
    };

    return (
        <div className="flex justify-between items-center px-4 py-2 bg-gray-100 rounded-lg">
            <span className="text-sm">{getStatusWithEmoji("Faucet", faucetStatus)}</span>
            <span className="text-sm">{getStatusWithEmoji("VM API", vmApiStatus)}</span>
            <span className="text-sm">{getStatusWithEmoji("Core API", coreApiStatus)}</span>
        </div>
    );
}
