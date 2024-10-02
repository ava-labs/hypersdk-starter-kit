import { useState, useRef } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { Token } from './App'

interface SwapProps {
  tokens: Token[];
}

const Swap: React.FC<SwapProps> = ({ tokens }) => {

  const [sellToken, setSellToken] = useState(tokens[0])
  const [buyToken, setBuyToken] = useState(tokens[0])
  const [sellDropdownOpen, setSellDropdownOpen] = useState(false)
  const [buyDropdownOpen, setBuyDropdownOpen] = useState(false)

  const [sellAmount, setSellAmount] = useState(0)
  const [buyAmount, setBuyAmount] = useState(0)

  const sellDropdownRef = useRef(null)
  const buyDropdownRef = useRef(null)

  const handleSwapTokens = () => {

    setSellToken(buyToken)
    setBuyToken(sellToken)

    setSellAmount(buyAmount)
    setBuyAmount(sellAmount)
  }

  return (
    <div className="bg-transparent min-h-screen">

      {/* Main Content */}
      <div className="flex items-center justify-center mt-20">
      <div className="bg-transparent p-6 rounded-3xl w-full max-w-sm">
        <div className="space-y-6">
        {/* Sell Section */}
        <div className="border border-gray-700 rounded-xl p-4">
          <label htmlFor="sellAmount" className="block text-lg font-medium text-gray-500 mb-2">
          Sell
          </label>
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
              setSellAmount(parseFloat(e.target.value))
            }
            }}
          />
          <div className="relative" ref={sellDropdownRef}>
            <button
            className="flex items-center space-x-2 bg-black hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-full"
            onClick={() => setSellDropdownOpen(!sellDropdownOpen)}
            >
            <span>{sellToken.symbol}</span>
            <ChevronDownIcon className="w-5 h-5 " />
            </button>
            <p className="text-sm text-gray-500 p-1">{sellToken.balance} </p>
            {sellDropdownOpen && (
            <div className="absolute right-0 mt-2 w-full bg-black rounded-md shadow-lg z-10">
              {tokens.map((token) => (
              <button
                key={token.name}
                className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600"
              >
                {token.symbol}
              </button>
              ))}
            </div>
            )}
          </div>
          </div>
        </div>

        {/* Change Direction Button */}
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
          <label htmlFor="buyAmount" className="block text-lg font-medium text-gray-500 mb-2">
          Buy
          </label>
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
              setBuyAmount(parseFloat(e.target.value))
            }
            }}
          />
          <div className="relative" ref={buyDropdownRef}>
            <button
            className="flex items-center space-x-2 bg-black hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-full"
            onClick={() => setBuyDropdownOpen(!buyDropdownOpen)}
            >
            <span>{buyToken.symbol}</span>
            <ChevronDownIcon className="w-5 h-5" />
            </button>
            <p className="text-sm text-gray-500 p-1">{sellToken.balance} </p>
            {buyDropdownOpen && (
            <div className="absolute right-0 mt-2 w-full bg-black rounded-md shadow-lg z-10">
              {tokens.map((token) => (
              <button
                key={token.address}
                className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600"
                onClick={() => {
                  setBuyToken(token)
                  setBuyDropdownOpen(false)
                }}
              >
                {token.symbol}
              </button>
              ))}
            </div>
            )}
          </div>
          </div>
        </div>

        {/* Swap Button */}
        <button className="w-full bg-black hover:bg-red-700 text-white font-bold py-4 px-4 rounded-full text-lg transition duration-300 ease-in-out transform hover:scale-105">
          Swap
        </button>
        </div>
      </div>
      </div>
    </div>
  )
}

export default Swap