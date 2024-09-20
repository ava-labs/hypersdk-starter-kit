import { useState } from 'react';

interface RemoveLiquidityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRemoveLiquidity: (amount: Number) => void;
}

const RemoveLiquidityModal: React.FC<RemoveLiquidityModalProps> = ({ isOpen, onClose, onRemoveLiquidity }) => {
  const [amountToRemove, setAmountToRemove] = useState<Number>(0);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (amountToRemove) {
      onRemoveLiquidity(amountToRemove);
      setAmountToRemove(0); // Reset the input
      onClose(); // Close the modal after submission
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-black rounded-lg shadow-lg w-96 p-6 relative z-50"> 
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-white">Remove Liquidity</h2>
          <button
            className="text-white hover:text-gray-600"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <div className="mb-4">
          <input
            type="text"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10"
            placeholder="0"
            value={amountToRemove.toString()}
            onChange={(e) => {
                if (e.target.value == '') {
                    setAmountToRemove(0);
                } else {
                    setAmountToRemove(parseFloat(e.target.value));
                }

            }}
          />
        </div>
        <p className="text-sm text-white p-1">Balance: </p>

        <div className="flex justify-end">
          <button
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
            onClick={handleSubmit}
          >
            - 
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveLiquidityModal;