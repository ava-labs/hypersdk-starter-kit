import { useState } from 'react';
import RemoveLiquidityModal from './RemoveLiquidityModal';
export default function RemoveLiquidity() {

    const [showModal, setShowModal] = useState<boolean>(false);
    const [amountToRemove, setAmountToRemove] = useState<number>(0);
    // Dummy data for liquidity pairs
    const liquidityPairs = [
        { id: 1, pair: 'RED/USDC', liquidity: '1000', price: '2000' },
        { id: 2, pair: 'BTC/USDT', liquidity: '500', price: '40000' },
        { id: 3, pair: 'XRP/USDT', liquidity: '2000', price: '1.5' },
    ];

    const handleRemoveLiquidity = (amount: number) => {
        setAmountToRemove(amount);
        setShowModal(false);
    }

    return (
        <div>
            {showModal && (
                <RemoveLiquidityModal
                    isOpen={true}
                    onClose={() => setShowModal(false)}
                    onRemoveLiquidity={handleRemoveLiquidity}
                />
            )}
            
            <table className="min-w-full">
                <thead>
                    <tr>
                        <th className="px-4 py-2">Pair</th>
                        <th className="px-4 py-2">Liquidity</th>
                        <th className="px-4 py-2">Price</th>
                        <th className="px-4 py-2">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {liquidityPairs.map(pair => (
                        <tr key={pair.id}>
                            <td className="border px-4 py-2">{pair.pair}</td>
                            <td className="border px-4 py-2">{pair.liquidity}</td>
                            <td className="border px-4 py-2">{pair.price}</td>
                            <td className="border px-4 py-2">
                                <button className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                onClick={
                                    () => setShowModal(true)
                                }>
                                    Remove Liquidity
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}