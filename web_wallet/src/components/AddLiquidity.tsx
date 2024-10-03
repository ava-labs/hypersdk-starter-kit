import { useState, useRef, useCallback } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { Token } from '../screens/App'
import { NewCreateLiquidityPoolAction, NewAddLiquidityAction, vmClient } from '../VMClient'

interface AddLiquidityProps {
  tokens: Token[];
  pools: LiquidityPair[];
  onAddLiquidity: (pair: LiquidityPair) => void;
  refreshPool: () => void;
}

interface LiquidityPair {
  poolAddress: string,
  poolTokenAddress: string,
  info?: LiquidityPairInfo
}

interface LiquidityPairInfo {
  tokenX: string,
  tokenY: string,
  fee: number,
  feeTo: string,
  functionID: number,
  reserveX: number,
  reserveY: number,
  liquidityToken: string,
  kLast: number,
  balance?: number
}


const AddLiquidity: React.FC<AddLiquidityProps> = ({ tokens, pools, onAddLiquidity, refreshPool }) => {
  const [logText, setLogText] = useState("")
  const [sellToken, setSellToken] = useState(tokens[0])
  const [buyToken, setBuyToken] = useState(tokens[0])
  const [sellDropdownOpen, setSellDropdownOpen] = useState(false)
  const [buyDropdownOpen, setBuyDropdownOpen] = useState(false)

  const [sellAmount, setSellAmount] = useState(0)
  const [buyAmount, setBuyAmount] = useState(0)
  const [functionID, setFunctionID] = useState(1)
  const [fee, setFee] = useState('1')

  const sellDropdownRef = useRef(null)
  const buyDropdownRef = useRef(null)

  const log = useCallback((level: "success" | "error" | "info", text: string) => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour12: false });
    const emoji = level === 'success' ? '✅' : level === 'error' ? '❌' : 'ℹ️';
    setLogText(prevLog => `${prevLog}\n${time} ${emoji} ${text}`);
    }, []);

  const handleAddLiquidity = async () => {

    // Create liquidity pool
    try {
      const payload = NewCreateLiquidityPoolAction(functionID, sellToken.address, buyToken.address, parseFloat(fee))
      const res = await vmClient.simulateAction(payload) as {poolAddress: string, poolTokenAddress: string}
      const addLiqPayload = NewAddLiquidityAction(sellAmount.toString(), buyAmount.toString(), sellToken.address, buyToken.address, res.poolAddress)
      await vmClient.sendTransaction([payload])     
      log("info", `Creating liquidity pool ${res.poolAddress}`)

      console.log(await vmClient.simulateAction(addLiqPayload))
      await vmClient.sendTransaction([addLiqPayload])
      log("info", `Liquidity added to pool ${res.poolAddress}`)


      onAddLiquidity(res)
      setBuyAmount(0)
      setSellAmount(0)

    } catch (error) {       // pool already exists
      const pool = pools.find(
        (p) =>
          (p.info?.tokenX === sellToken.address && p.info?.tokenY === buyToken.address) ||
          (p.info?.tokenX === buyToken.address && p.info?.tokenY === sellToken.address)
      );

      if (pool) {
        log("info", `Pool already exists!`)
        try {
          const addLiqPayload = NewAddLiquidityAction(sellAmount.toString(), buyAmount.toString(), sellToken.address, buyToken.address, pool.poolAddress);
          const res = await vmClient.simulateAction(addLiqPayload)
          console.log(res)
          await vmClient.sendTransaction([addLiqPayload]);
          log("info", `Liquidity added to pool ${pool.poolAddress}`)

          refreshPool()
          setBuyAmount(0)
          setSellAmount(0)
        }
        catch (error) {
          log("error", `Failed to add liquidity: ${(error as { message?: string })?.message || String(error)}`);
        }
      }
    }
  }

  const handleSwapTokens = () => {
    setSellToken(buyToken)
    setBuyToken(sellToken)
    setSellAmount(buyAmount)
    setBuyAmount(sellAmount)
  }

  return (
    <div className="bg-transparent min-h-screen">
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
                  <p className="text-sm text-gray-500 p-1">{sellToken.balance}</p>
                  {sellDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-full bg-black rounded-md shadow-lg z-10">
                      {tokens.map((token) => (
                        <button
                          key={token.symbol}
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
                  <p className="text-sm text-gray-500 p-1">{buyToken.balance}</p>
                  {buyDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-full bg-black rounded-md shadow-lg z-10">
                      {tokens.map((token) => (
                        <button
                          key={token.symbol}
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

            {/* Function ID Input */}
            <div className="border border-gray-700 rounded-xl p-4">
              <label htmlFor="functionID" className="block text-sm font-medium text-gray-500 mb-2">
              Function ID
              </label>
              <input
              type="text"
              id="functionID"
              className="bg-transparent text-2xl font-bold text-gray-500 w-full focus:outline-none"
              placeholder="Function ID"
              value={functionID}
              onChange={(e) => setFunctionID(e.target.value)}
              />
            </div>

            {/* Fee Input */}
            <div className="border border-gray-700 rounded-xl p-4">
              <label htmlFor="fee" className="block text-sm font-medium text-gray-500 mb-2">
              Fee
              </label>
              <input
              type="text"
              id="fee"
              className="bg-transparent text-2xl font-bold text-gray-500 w-full focus:outline-none"
              placeholder="Fee"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              />
            </div>

            {/* Add Liquidity Button */}
            <button 
              className="w-full bg-black hover:bg-red-700 text-white font-bold py-4 px-4 rounded-full text-lg transition duration-300 ease-in-out transform hover:scale-105"
              onClick={handleAddLiquidity}
            >
              Add Liquidity
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

export default AddLiquidity