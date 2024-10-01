import { useState, useCallback, useEffect, useReducer } from 'react'
import { vmClient } from '../VMClient'
import { VMABI } from 'hypersdk-client/src/lib/Marshaler';
import { ArrowPathIcon } from '@heroicons/react/20/solid'
import { stringify } from 'lossless-json'
import { ExecutedBlock } from 'hypersdk-client/src/client/apiTransformers';

import TimeAgo from 'javascript-time-ago'
import timeAgoEn from 'javascript-time-ago/locale/en'
TimeAgo.addDefaultLocale(timeAgoEn)
const ago = new TimeAgo('en-US')

const getDefaultValue = (fieldType: string) => {
    if (fieldType === 'Address') return "00" + "00".repeat(27) + "00deadc0de"
    if (fieldType === '[]uint8') return btoa('Luigi');
    if (fieldType === 'string') return 'Hello';
    if (fieldType === 'uint64') return '123456789';
    if (fieldType.startsWith('int') || fieldType.startsWith('uint')) return '0';
    return '';
}


function Action({ actionName, abi, fetchBalance }: { actionName: string, abi: VMABI, fetchBalance: (waitForChange: boolean) => void }) {
    const actionType = abi.types.find(t => t.name === actionName)
    const action = abi.actions.find(a => a.name === actionName)
    const [actionLogs, setActionLogs] = useState<string[]>([])
    const [actionInputs, setActionInputs] = useState<Record<string, string>>({})

    useEffect(() => {
        if (actionType) {
            setActionInputs(prev => {
                for (const field of actionType.fields) {
                    if (!(field.name in prev)) {
                        prev[field.name] = getDefaultValue(field.type)
                    }
                }
                return prev
            })
        }
    }, [actionName, actionType]);

    const executeAction = async (actionName: string, isReadOnly: boolean) => {
        setActionLogs([])
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setActionLogs(prev => [...prev, `${now} - Executing...`])
        try {
            setActionLogs(prev => [...prev, `Action data for ${actionName}: ${JSON.stringify(actionInputs, null, 2)}`])
            const result = isReadOnly
                ? await vmClient.simulateAction({ actionName, data: actionInputs })
                : await vmClient.sendTransaction([{ actionName, data: actionInputs }])
            const endTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setActionLogs(prev => [...prev, `${endTime} - Success: ${stringify(result, null, 2)}`])
            if (!isReadOnly) {
                fetchBalance(true)
            }
        } catch (e) {
            console.error(e)
            const errorTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setActionLogs(prev => [...prev, `${errorTime} - Error: ${e}`])
        }
    }

    const handleInputChange = (fieldName: string, value: string) => {
        setActionInputs(prev => ({
            ...prev, [fieldName]: value
        }))
    }

    if (!action) {
        return <div>Action not found</div>
    }
    return (
        <div key={action.id} className="mb-6 p-4 border border-gray-300 rounded  text-sm">
            <h3 className="text-xl font-semibold mb-2">{action.name}</h3>
            <div className="mb-4">
                <h4 className="font-semibold mb-1">Input Fields:</h4>
                {actionType?.fields.map(field => {
                    if (field.type.includes('[]') && field.type !== '[]uint8') {
                        return <p key={field.name} className="text-red-500">Warning: Array type not supported for {field.name}</p>
                    }
                    return (
                        <div key={field.name} className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">{field.name}: {field.type}</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2"
                                value={actionInputs[field.name] ?? ""}
                                onChange={(e) => handleInputChange(field.name, e.target.value)}
                            />
                        </div>
                    )
                })}
            </div>
            <div className="flex space-x-2 mb-2">
                <button
                    onClick={() => executeAction(action.name, true)}
                    className="px-4 py-2 bg-gray-200 text-black font-bold rounded hover:bg-gray-300"
                >
                    Execute Read Only
                </button>
                <button
                    onClick={() => executeAction(action.name, false)}
                    className="px-4 py-2 bg-black text-white font-bold rounded hover:bg-gray-800"
                >
                    Execute in Transaction
                </button>
            </div>
            <div className="bg-gray-100 p-2 rounded">
                <h4 className="font-semibold mb-1">Log:</h4>
                <pre className="whitespace-pre-wrap">{actionLogs.join('\n') || 'No logs yet.'}</pre>
            </div>
        </div>
    )
}

export default function Wallet({ myAddr }: { myAddr: string }) {
    const [balance, setBalance] = useState<bigint | null>(null)
    const [balanceLoading, setBalanceLoading] = useState(false)
    const [balanceError, setBalanceError] = useState<string | null>(null)
    const [abi, setAbi] = useState<VMABI | null>(null)
    const [abiLoading, setAbiLoading] = useState(false)
    const [abiError, setAbiError] = useState<string | null>(null)

    // Balance fetching
    const fetchBalance = useCallback(async () => {
        setBalanceLoading(true)
        try {
            setBalance(await vmClient.getBalance(myAddr))
            setBalanceError(null)
        } catch (e) {
            console.error("Failed to fetch balance:", e)
            setBalanceError((e instanceof Error && e.message) ? e.message : String(e))
        } finally {
            setBalanceLoading(false)
        }
    }, [myAddr]);

    useEffect(() => {
        fetchBalance()
    }, [fetchBalance])

    // ABI fetching
    useEffect(() => {
        setAbiLoading(true)
        vmClient.getAbi()
            .then(newAbi => {
                setAbi(newAbi)
                setAbiError(null)
            })
            .catch(e => {
                console.error("Failed to fetch ABI:", e)
                setAbiError((e instanceof Error && e.message) ? e.message : String(e))
            })
            .finally(() => setAbiLoading(false))
    }, [])

    return (
        <div className="w-full bg-white p-8">
            <div className="lg:flex lg:space-x-8">
                <div className="lg:w-2/3">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-2">Address</h2>
                        <div className="text-md font-mono break-all bg-gray-100 p-3 rounded text-sm truncate">{myAddr}</div>
                    </div>
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-2">Balance</h2>
                        {balanceLoading ? (
                            <div>Loading balance...</div>
                        ) : balanceError ? (
                            <div>Error loading balance: {balanceError}</div>
                        ) : balance !== null ? (
                            <div className="flex items-center">
                                <div className="text-4xl font-bold mr-2">
                                    {parseFloat(vmClient.formatNativeTokens(balance)).toFixed(6)} {"COIN"}
                                </div>
                                <button onClick={() => fetchBalance()} className="p-2 rounded-full hover:bg-gray-200">
                                    <ArrowPathIcon className="h-5 w-5" />
                                </button>
                            </div>
                        ) : null}
                    </div>
                    <div>
                        {abiLoading ? (
                            <div>Loading ABI...</div>
                        ) : abiError ? (
                            <div>Error loading ABI: {abiError}</div>
                        ) : abi ? (
                            abi.actions.map(action => (
                                <Action key={action.id} actionName={action.name} abi={abi} fetchBalance={fetchBalance} />
                            ))
                        ) : null}
                    </div>
                </div>
                <LatestBlocks />
            </div>
        </div>
    )
}

export function LatestBlocks() {
    const [blocks, setBlocks] = useState([] as ExecutedBlock[]);
    const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

    useEffect(() => {
        const unsubscribe = vmClient.listenToBlocks((block) => {
            console.log("New block", block)
            setBlocks((prevBlocks) => [block, ...prevBlocks].slice(0, 5));
        });

        const intervalId = setInterval(() => {
            forceUpdate();
        }, 10000);

        return () => {
            (async () => {
                try {
                    (await unsubscribe)();
                    clearInterval(intervalId);
                } catch (error) {
                    console.error('Error unsubscribing:', error);
                }
            })();
        };
    }, []);

    return (
        <div className="lg:w-1/3 mt-8 lg:mt-0">
            <h2 className="text-lg font-semibold mb-2">Latest Blocks</h2>
            <div>
                {blocks.length === 0 ? (
                    <p>Waiting for new blocks (empty blocks are skipped)...</p>
                ) : (
                    blocks.map((block) => (
                        <div key={block.height} className="mb-4 last:mb-0 bg-gray-100 p-4 rounded">
                            <h3 className="text-xl font-bold">Block #{block.height}</h3>
                            <p className="text-sm text-gray-600">({ago.format(block.timestamp, 'round')})</p>
                            <div className="mt-2">
                                <p className="text-xs text-gray-500 truncate">Parent: <span className="font-mono">{block.parent}</span></p>
                                <p className="text-xs text-gray-500 truncate">State Root: <span className="font-mono">{block.stateRoot}</span></p>
                                <p className="text-sm font-semibold mt-2">{block.transactions.length} Transaction{block.transactions.length === 1 ? '' : 's'}</p>
                            </div>
                            {block.transactions.map((tx, index) => (
                                <div key={index} className="mt-3 p-2 bg-white rounded shadow">
                                    <p className="font-semibold">{tx.response.success ? '✅ Success' : '❌ Failed'}</p>
                                    <p className="text-xs mt-1">Sender: <span className="font-mono">tx.sender</span></p>
                                    <div className="mt-2 overflow-x-auto">
                                        <pre className="text-xs">{JSON.stringify(tx.actions, null, 2)}</pre>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}


