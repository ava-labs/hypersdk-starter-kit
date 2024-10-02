import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { vmClient, NewRemoveLiquidityAction } from '../VMClient'

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


interface RemoveLiquidityProps {
    pools: LiquidityPair[];
    onRemoveLiquidity: (pair: LiquidityPair) => void;
    refreshPool: () => void;
}

export default function RemoveLiquidity({ pools, onRemoveLiquidity, refreshPool }: RemoveLiquidityProps) {

  const [showModal, setShowModal] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [selectedPair, setSelectedPair] = useState<LiquidityPair | null>(null)

  
  const handleRemoveLiquidityModal = (pair: LiquidityPair) => {
    setSelectedPair(pair)
    setShowModal(true)
  }

  const handleInfoModal = (pair: LiquidityPair) => {
    setSelectedPair(pair)
    setShowInfoModal(true)
  }

  return (
    <div className="bg-transparent min-h-screen">
      <div className="flex items-center justify-center mt-20">
        <div className="bg-transparent p-6 rounded-3xl w-full max-w-4xl">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">Remove Liquidity</h2>
            <div className="space-y-4">
            {pools.map((pair) => (
              <div key={pair.poolAddress} className="border border-gray-700 rounded-xl p-4 space-y-4">
              <div className="flex justify-between items-center">
              <div className="flex-1 text-center">
              <div className="text-xs text-gray-600">Pool Address</div>
              <div className="text-sm font-medium text-black">{pair.poolAddress.substring(0, 12)}...</div>
              </div>
              <div className="flex-1 text-center">
                <div className="flex justify-center space-x-4">
                <button 
                  className="bg-black hover:bg-green-700 text-white font-bold py-2 px-3 rounded-full text-sm transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={() => handleInfoModal(pair)}
                >
                  Info
                </button>
                <button 
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-3 rounded-full text-sm transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  onClick={() => handleRemoveLiquidityModal(pair)}
                >
                  Remove
                </button>
                </div>
              </div>
              </div>
              </div>
            ))}
            </div>
        </div>
      </div>
      <AnimatePresence>
        {showModal && selectedPair && (
          <RemoveLiquidityModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            pair={selectedPair}
            handleRemove={onRemoveLiquidity}
            handleRefresh={refreshPool}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showInfoModal && selectedPair && (
          <LiquidityInfoModal
            isOpen={showInfoModal}
            onClose={() => setShowInfoModal(false)}
            pair={selectedPair}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function RemoveLiquidityModal({ isOpen, onClose, pair, handleRemove, handleRefresh }: { isOpen: boolean; onClose: () => void; pair: LiquidityPair, handleRemove: (pair: LiquidityPair) => void, handleRefresh: () => void }) {
  const [amount, setAmount] = useState('')

  const handleRemoveLiquidity = async () => {
    console.log(`Removing ${amount} liquidity from ${pair}`)
    if (pair.info?.tokenX && pair.info?.tokenY) {
      const action = NewRemoveLiquidityAction(amount, pair.poolAddress, pair.info.tokenX, pair.info.tokenY)
      console.log(await vmClient.simulateAction(action))
      await vmClient.sendTransaction([action])

    }
    handleRefresh()
    handleRemove(pair)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-40 flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-gray-800 rounded-lg p-6 w-full max-w-md m-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4 text-white">Remove Liquidity</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleRemoveLiquidity(); }} className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-300 w-1/3">
                    Current Liquidity Token Balance
                  </label>
                  <p className="mt-1 block w-2/3 shadow-sm sm:text-sm border-gray-600 rounded-md bg-gray-700 p-2 text-white">
                    {pair.info?.balance?.toString()}
                  </p>
                </div>
                <div className="flex items-center">
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-300 w-1/3">
                    Amount to Remove
                  </label>
                  <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 block w-2/3 shadow-sm sm:text-sm border-gray-600 rounded-md bg-gray-700 p-2 text-white focus:ring-red-500 focus:border-red-500"
                    placeholder="Enter amount"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                >
                  Confirm
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


const LiquidityInfoModal = ({ isOpen, onClose, pair }: { isOpen: boolean; onClose: () => void; pair: LiquidityPair }) => {

return (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-40 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-gray-800 rounded-lg p-6 w-full max-w-md m-4 shadow-xl overflow-y-auto max-h-full"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-2xl font-bold mb-4 text-white">Liquidity Pair Info</h2>
            <div className="space-y-4">
            <div className="flex items-center">
              <label className="block text-sm font-medium text-gray-300 w-1/3">
              Pool Address
              </label>
              <p className="mt-1 block w-2/3 shadow-sm sm:text-sm border-gray-600 rounded-md bg-gray-700 p-2 text-white break-words">
              {pair.poolAddress}
              </p>
            </div>
            <div className="flex items-center">
              <label className="block text-sm font-medium text-gray-300 w-1/3">
              Pool Token Address
              </label>
              <p className="mt-1 block w-2/3 shadow-sm sm:text-sm border-gray-600 rounded-md bg-gray-700 p-2 text-white break-words">
              {pair.poolTokenAddress}
              </p>
            </div>
            {pair.info && (
              <>
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-300 w-1/3">
                Token X
                </label>
                <p className="mt-1 block w-2/3 shadow-sm sm:text-sm border-gray-600 rounded-md bg-gray-700 p-2 text-white break-words">
                {pair.info.tokenX}
                </p>
              </div>
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-300 w-1/3">
                Token Y
                </label>
                <p className="mt-1 block w-2/3 shadow-sm sm:text-sm border-gray-600 rounded-md bg-gray-700 p-2 text-white break-words">
                {pair.info.tokenY}
                </p>
              </div>
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-300 w-1/3">
                Fee
                </label>
                <p className="mt-1 block w-2/3 shadow-sm sm:text-sm border-gray-600 rounded-md bg-gray-700 p-2 text-white break-words">
                {pair.info.fee.toString()}
                </p>
              </div>
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-300 w-1/3">
                Fee To
                </label>
                <p className="mt-1 block w-2/3 shadow-sm sm:text-sm border-gray-600 rounded-md bg-gray-700 p-2 text-white break-words">
                {pair.info.feeTo}
                </p>
              </div>
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-300 w-1/3">
                Function ID
                </label>
                <p className="mt-1 block w-2/3 shadow-sm sm:text-sm border-gray-600 rounded-md bg-gray-700 p-2 text-white break-words">
                {pair.info.functionID.toString()}
                </p>
              </div>
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-300 w-1/3">
                Reserve X
                </label>
                <p className="mt-1 block w-2/3 shadow-sm sm:text-sm border-gray-600 rounded-md bg-gray-700 p-2 text-white break-words">
                {vmClient.formatNativeTokens(BigInt(pair.info.reserveX))}
                </p>
              </div>
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-300 w-1/3">
                Reserve Y
                </label>
                <p className="mt-1 block w-2/3 shadow-sm sm:text-sm border-gray-600 rounded-md bg-gray-700 p-2 text-white break-words">
                {vmClient.formatNativeTokens(BigInt(pair.info.reserveY))}
                </p>
              </div>
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-300 w-1/3">
                Liquidity Token
                </label>
                <p className="mt-1 block w-2/3 shadow-sm sm:text-sm border-gray-600 rounded-md bg-gray-700 p-2 text-white break-words">
                {pair.info.liquidityToken}
                </p>
              </div>
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-300 w-1/3">
                K Last
                </label>
                <p className="mt-1 block w-2/3 shadow-sm sm:text-sm border-gray-600 rounded-md bg-gray-700 p-2 text-white break-words">
                {pair.info.kLast.toString()}
                </p>
              </div>
              {pair.info.balance && (
                <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-300 w-1/3">
                  My Balance
                </label>
                <p className="mt-1 block w-2/3 shadow-sm sm:text-sm border-gray-600 rounded-md bg-gray-700 p-2 text-white break-words">
                  {pair.info.balance.toString()}
                </p>
                </div>
              )}
              </>
            )}
            </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
) 

}