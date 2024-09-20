import { useState, useRef } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import AddTokenModal from './AddTokenModal'

interface CreatePairProps {
  tokens: string[];
  onAddToken: (newToken: string) => void;
}

// users have to specify a model ID, tokenX, tokenY, and a fee
const CreatePair: React.FC<CreatePairProps> = ({ tokens, onAddToken }) => {
  const [showAddTokenModal, setShowAddTokenModal] = useState(false)
  const [sellToken, setSellToken] = useState('RED')
  const [buyToken, setBuyToken] = useState('USDC')
  const [sellDropdownOpen, setSellDropdownOpen] = useState(false)
  const [buyDropdownOpen, setBuyDropdownOpen] = useState(false)

  const [sellAmount, setSellAmount] = useState(0)
  const [buyAmount, setBuyAmount] = useState(0)

  const [modelId, setModelId] = useState('')
  const [fee, setFee] = useState(0)

  const sellDropdownRef = useRef(null)
  const buyDropdownRef = useRef(null)

const handleAddToken = (token: string) => {
    onAddToken(token)
  }
  const handleSwapTokens = () => {
    setSellToken(buyToken)
    setBuyToken(sellToken)

    setSellAmount(buyAmount)
    setBuyAmount(sellAmount)
  }

  return (
    <div className="bg-transparent min-h-screen">
      {showAddTokenModal && (
      <AddTokenModal
        isOpen={showAddTokenModal}
        onClose={() => setShowAddTokenModal(false)}
        onAddToken={handleAddToken}
      />
      )}
      {/* Main Content */}
      <div className="flex items-center justify-center mt-20">
        <div className="bg-transparent p-6 rounded-3xl w-full max-w-sm">
          <div className="space-y-6">
            {/* Sell Section */}
            <div className="border border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  id="sellAmount"
                  className="bg-transparent text-5xl font-bold text-gray-500 w-full focus:outline-none"
                  placeholder="0"
                  value={sellAmount}
                  onChange={(e) => {
                    if (e.target.value === '') {
                      setSellAmount(0)
                    } else {
                      setSellAmount(parseFloat(e.target.value))}

                    }}
                />
                <div className="relative" ref={sellDropdownRef}>
                  <button 
                    className="flex items-center space-x-2 bg-black hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-full"
                    onClick={() => setSellDropdownOpen(!sellDropdownOpen)}
                  >
                    <img src="/placeholder.svg?height=24&width=24" alt="AVAX" className="w-6 h-6 rounded-full bg-blue-500" />
                    <span>{sellToken}</span>
                    <ChevronDownIcon className="w-5 h-5" />
                  </button>
                  <p className="text-sm text-gray-500 p-1">Balance: </p>
                  {sellDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-full bg-black rounded-md shadow-lg z-10">
                      {tokens.map((token) => (
                        <button
                          key={token}
                          className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600"
                          onClick={() => {
                            if (token === "Add Token") {
                              setShowAddTokenModal(true)
                            } else {
                              setSellToken(token)
                              setSellDropdownOpen(false)
                            }
                          }}
                        >
                          {token}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <button 
                className="bg-transparent p-2 rounded-lg hover:bg-black"
                onClick={handleSwapTokens}
              >
                <ChevronDownIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Buy Section */}
            <div className="border border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <input
                  type="text"
                  id="buyAmount"
                  className="bg-transparent text-5xl font-bold text-gray-500 w-full focus:outline-none"
                  placeholder="0"
                  value={buyAmount}
                  onChange={(e) => {
                    if (e.target.value === '') {
                      setBuyAmount(0)
                    } else {
                      setBuyAmount(parseFloat(e.target.value))}

                    }}
                />
                <div className="relative" ref={buyDropdownRef}>
                  <button 
                    className="flex items-center space-x-2 bg-black hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-full"
                    onClick={() => setBuyDropdownOpen(!buyDropdownOpen)}
                  >
                    <img src="/placeholder.svg?height=24&width=24" alt="ETH" className="w-6 h-6 rounded-full bg-blue-500" />
                    <span>{buyToken}</span>
                    <ChevronDownIcon className="w-5 h-5" />
                  </button>
                  {buyDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-full bg-black rounded-md shadow-lg z-10">
                      {tokens.map((token) => (
                        <button
                          key={token}
                          className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600"
                          onClick={() => {
                            if (token === "Add Token") {
                              setShowAddTokenModal(true)
                            } else {
                              setBuyToken(token)
                              setBuyDropdownOpen(false)
                            }
                          }}
                        >
                          {token}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
                  {/* Model ID */}
                  <div className="border border-gray-700 rounded-xl p-4">
                    <input
                      type="text"
                      id="modelId"
                      className="bg-transparent text-2xl font-bold text-gray-500 w-full focus:outline-none"
                      placeholder="Model ID"
                      value={modelId}
                      onChange={(e) => setModelId(e.target.value)}
                    />
                  </div>

                  {/* Fee */}
                  <div className="border border-gray-700 rounded-xl p-4">
                    <input
                      type="number"
                      id="fee"
                      className="bg-transparent text-2xl font-bold text-gray-500 w-full focus:outline-none"
                      placeholder="Fee"
                      onChange={(e) => setFee(parseFloat(e.target.value))}
                    />
                  </div>
            {/* Create Button */}
            <button className="w-full bg-black hover:bg-red-700 text-white font-bold py-4 px-4 rounded-full text-lg transition duration-300 ease-in-out transform hover:scale-105">
              Create Pair
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
export default CreatePair