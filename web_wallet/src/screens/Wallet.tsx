import { useState, useCallback, useEffect } from 'react'
import { vmClient } from '../VMClient'
import { VMABI } from 'hypersdk-client/src/lib/Marshaler';
import { ArrowPathIcon } from '@heroicons/react/20/solid'
import { stringify } from 'lossless-json'

export default function Wallet({ myAddr }: { myAddr: string }) {
    const [balance, setBalance] = useState(0n)
    const [loading, setLoading] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [abi, setAbi] = useState<VMABI | null>(null)
    const [actionLogs, setActionLogs] = useState<Record<string, string>>({})
    const [actionInputs, setActionInputs] = useState<Record<string, Record<string, string>>>({})

    const fetchBalance = useCallback(async () => {
        setLoading(l => l + 1)
        try {
            const balance = await vmClient.getBalance(myAddr)
            setBalance(balance)
            setError(null)
        } catch (e) {
            console.error("Failed to fetch balance:", e)
            setError((e instanceof Error && e.message) ? e.message : String(e))
        } finally {
            setLoading(l => l - 1)
        }
    }, [myAddr]);

    useEffect(() => {
        fetchBalance()
    }, [fetchBalance])

    useEffect(() => {
        setLoading(l => l + 1)
        vmClient.getAbi()
            .then(setAbi)
            .catch(e => {
                console.error("Failed to fetch ABI:", e)
                setError((e instanceof Error && e.message) ? e.message : String(e))
            })
            .finally(() => setLoading(l => l - 1))
    }, [])


    const executeAction = async (actionName: string, isReadOnly: boolean) => {
        const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setActionLogs(prev => ({ ...prev, [actionName]: `${now} - Executing...` }))
        try {
            const data = actionInputs[actionName] || {}
            setActionLogs(prev => ({ ...prev, [actionName]: `Action data for ${actionName}: ${JSON.stringify(data, null, 2)}` }))
            const result = isReadOnly
                ? await vmClient.executeReadonlyAction({ actionName, data })
                : await vmClient.sendTx([{ actionName, data }])
            const endTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setActionLogs(prev => ({ ...prev, [actionName]: `${endTime} - Success: ${stringify(result)}` }))
        } catch (e) {
            const errorTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setActionLogs(prev => ({ ...prev, [actionName]: `${errorTime} - Error: ${e}` }))
        }
    }

    const handleInputChange = (actionName: string, fieldName: string, value: string) => {
        setActionInputs(prev => ({
            ...prev,
            [actionName]: {
                ...(prev[actionName] || {}),
                [fieldName]: value
            }
        }))
    }

    const getDefaultValue = (fieldType: string) => {
        if (fieldType === 'Address') return '00'.repeat(33);
        if (fieldType === 'Bytes') return "";
        if (fieldType === 'string') return 'Hello';
        if (fieldType.startsWith('int') || fieldType.startsWith('uint')) return '0';
        return '';
    }

    if (loading > 0) {
        return <div>Loading...</div>
    }

    if (error) {
        return <div>Error: {error}</div>
    }

    return (
        <div className="w-full bg-white p-8">
            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Address:</h2>
                <div className="text-md font-mono break-all bg-gray-100 p-3 rounded">{myAddr}</div>
            </div>
            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Balance:</h2>
                <div className="flex items-center">
                    <div className="text-4xl font-bold mr-2">
                        {parseFloat(vmClient.formatBalance(balance)).toFixed(6)} {vmClient.COIN_SYMBOL}
                    </div>
                    <button onClick={fetchBalance} className="p-2 rounded-full hover:bg-gray-200">
                        <ArrowPathIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
            <div>
                {abi?.actions.map(action => {
                    const actionType = abi.types.find(t => t.name === action.name)
                    return (
                        <div key={action.id} className="mb-6 p-4 border border-gray-300 rounded">
                            <h3 className="text-xl font-semibold mb-2">{action.name}</h3>
                            <div className="mb-4">
                                <h4 className="font-semibold mb-1">Input Fields:</h4>
                                {actionType?.fields.map(field => {
                                    if (field.type.includes('[]')) {
                                        return <p key={field.name} className="text-red-500">Warning: Array type not supported for {field.name}</p>
                                    }
                                    const defaultValue = getDefaultValue(field.type);
                                    return (
                                        <div key={field.name} className="mb-2">
                                            <label className="block text-sm font-medium text-gray-700">{field.name}: {field.type}</label>
                                            <input
                                                type="text"
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                                value={actionInputs[action.name]?.[field.name] ?? defaultValue}
                                                onChange={(e) => handleInputChange(action.name, field.name, e.target.value)}
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
                                <pre className="whitespace-pre-wrap">{actionLogs[action.name] || 'No logs yet.'}</pre>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
