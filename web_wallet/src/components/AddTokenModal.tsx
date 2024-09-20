import { useState } from 'react';

interface AddTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToken: (contractAddress: string) => void;
}

const AddTokenModal: React.FC<AddTokenModalProps> = ({ isOpen, onClose, onAddToken }) => {
  const [contractAddress, setContractAddress] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (contractAddress) {
      onAddToken(contractAddress);
      setContractAddress(''); // Reset the input
      onClose(); // Close the modal after submission
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-black rounded-lg shadow-lg w-96 p-6 relative z-50"> 
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-white">Add Token Address</h2>
          <button
            className="text-white hover:text-gray-600"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-white">
            Contract Address
          </label>
          <input
            type="text"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10"
            placeholder="0x...(change this later)"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <button
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
            onClick={handleSubmit}
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTokenModal;