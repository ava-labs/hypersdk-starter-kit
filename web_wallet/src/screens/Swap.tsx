import { useState, useRef, useCallback, useEffect } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { Token, LiquidityPair } from '../VMClient.tsx'
import {NewSwapAction, vmClient} from '../VMClient'

interface SwapProps {
  tokens: Token[];
  pools: LiquidityPair[];
}

const Swap: React.FC<SwapProps> = ({ tokens, pools }) => {
  const [logText, setLogText] = useState("")

  const [sellToken, setSellToken] = useState(tokens[0])
  const [buyToken, setBuyToken] = useState(tokens[0])
  const [sellDropdownOpen, setSellDropdownOpen] = useState(false)
  const [buyDropdownOpen, setBuyDropdownOpen] = useState(false)

  const [sellAmount, setSellAmount] = useState(0)
  const [buyAmount, setBuyAmount] = useState('0')

  const sellDropdownRef = useRef(null)
  const buyDropdownRef = useRef(null)

  const log = useCallback((level: "success" | "error" | "info", text: string) => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour12: false });
    const emoji = level === 'success' ? '✅' : level === 'error' ? '❌' : 'ℹ️';
    setLogText(prevLog => `${prevLog}\n${time} ${emoji} ${text}`);
    }, []);
    
  const handleSwapTokens = () => {

    setSellToken(buyToken)
    setBuyToken(sellToken)

    setSellAmount(parseFloat(buyAmount))
    setBuyAmount(sellAmount.toString())
  }

  const swap = async () => {
    if (!pools) {
      console.error('Pools array is undefined');
      return;
    }

    const pool = pools.find((pool) => {
      return (pool.info?.tokenX === sellToken.address && pool.info?.tokenY === buyToken.address) ||
       (pool.info?.tokenX === buyToken.address && pool.info?.tokenY === sellToken.address);
    });

    if (!pool) {
      console.error('No matching pool found');
      return;
    }
    console.log(pool.poolAddress)
    try {
      const payload = NewSwapAction(sellToken.address, buyToken.address, sellAmount.toString(), sellToken.address, pool.poolAddress)
      const res = await vmClient.simulateAction(payload) as {amountOut: number, tokenOut: string}
      log('info', `Swap simulation Successful. Received ${res.amountOut} ${res.tokenOut}`)
      await vmClient.sendTransaction([payload])
      log('success', `Swap Successful. Received ${res.amountOut} ${res.tokenOut}`)
      setSellAmount(0)
      setBuyAmount('0')

    } catch {
      log('error', 'Swap Failed')
    }
  }

  useEffect(() => {
    if (!pools) {
      console.error('Pools array is undefined');
      return;
    }

    const pool = pools.find((pool) => {
      return (pool.info?.tokenX === sellToken.address && pool.info?.tokenY === buyToken.address) ||
       (pool.info?.tokenX === buyToken.address && pool.info?.tokenY === sellToken.address);
    });

    if (!pool) {
      console.error('No matching pool found');
      return;
    }
    const getExpectedOutput = async () => {
      try {
        const payload = NewSwapAction(sellToken.address, buyToken.address, sellAmount.toString(), sellToken.address, pool.poolAddress)
        const res = await vmClient.simulateAction(payload) as {amountOut: number, tokenOut: string}
        setBuyAmount(vmClient.formatNativeTokens(BigInt(res.amountOut)))
      } catch {
        setBuyAmount('0')
      }
    }
    getExpectedOutput()
  }, [sellAmount, sellToken, buyToken, pools])

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
              type="number"
              // step="0.0001"
              id="sellAmount"
              className="bg-transparent text-5xl font-bold text-gray-500 w-full focus:outline-none"
              placeholder="0"
              value={sellAmount}
              onChange={(e) => {
              const value = parseFloat(e.target.value);
              
              setSellAmount(value);
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
              key={token.address}
              className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-gray-600"
              onClick={() => {
              setSellToken(token)
              setSellDropdownOpen(false)
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
          Receive
          </label>
            <div className="flex items-center justify-between">
            <label className="bg-transparent text-5xl font-bold text-gray-500 w-full focus:outline-none">
              {buyAmount.substring(0,5)}
            </label>
            <div className="relative" ref={buyDropdownRef}>
              <button
              className="flex items-center space-x-2 bg-black hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-full"
              onClick={() => setBuyDropdownOpen(!buyDropdownOpen)}
              >
              <span>{buyToken.symbol}</span>
              <ChevronDownIcon className="w-5 h-5" />
              </button>
              <p className="text-sm text-gray-500 p-1">{buyToken.balance} </p>
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
        <button 
        className="w-full bg-black hover:bg-red-700 text-white font-bold py-4 px-4 rounded-full text-lg transition duration-300 ease-in-out transform hover:scale-105"
        onClick={swap}>
          Swap
        </button>
        </div>
      </div>
      
      </div>
      <div className="mt-8 border border-gray-300 rounded p-4 min-h-16">
            <pre className="font-mono text-sm">
                {logText}
            </pre>
        </div>      
    </div>
  )
}

export default Swap