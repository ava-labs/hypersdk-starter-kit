"use client"

import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { vmClient } from "../VMClient"
import { Token } from '../screens/App'

interface CreateTokenModalProps {
  myAddr: string;
    onAddToken: (token: Token) => void;
}

export const CreateTokenModal: React.FC<CreateTokenModalProps> = ({ myAddr, onAddToken }) => {
  const [name, setName] = useState("")
  const [symbol, setSymbol] = useState("")
  const [metadata, setMetadata] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // sanity check
    // const p = vmClient.newTransferAction("00c4cb545f748a28770042f893784ce85b107389004d6a0e0d6d7518eeae1292d9", "1")
    // const txInfo = await vmClient.sendTx([p])
    // console.log(txInfo)


    console.log("Creating token with:", { name, symbol, metadata })
    const payload = vmClient.NewTokenAction(name, symbol, metadata)
    const tokenRes = await vmClient.executeReadonlyAction(payload) as { tokenAddress: string }
    console.log("token address: ", tokenRes.tokenAddress)
    const txId = await vmClient.sendTx([payload])
    console.log("txId:", txId)


    // const mintPayload = vmClient.MintTokenAction(myAddr, 1000000000, tokenRes.tokenAddress)
    // console.log("mintPayload:", await vmClient.executeReadonlyAction(mintPayload))
    // await vmClient.sendTx([mintPayload])
    

    // const tokenInfoAction = vmClient.NewTokenInfoAction(tokenRes.tokenAddress)
    // const res = await vmClient.executeReadonlyAction(tokenInfoAction) as unknown as { name: string, symbol: string, metadata: string, supply: string, owner: string }
    // console.log(res)


    // const token: Token = {
    //   name: name,
    //   symbol: symbol,
    //   metadata: metadata,
    //   balance: "0",
    //   address: tokenRes.tokenAddress,
    //   totalSupply: res.supply,
    //   owner: res.owner
    // }
    // onAddToken(token)
    setName("")
    setSymbol("")
    setMetadata("")
    setIsOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
      >
        Create Token
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-40 flex items-center justify-center"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4">
                <h2 className="text-xl font-bold mb-2">Create New Token</h2>
                <p className="text-gray-600">
                  Enter the details for your new token. Click create when you're done.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-1">
                    Symbol
                  </label>
                  <input
                    id="symbol"
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="metadata" className="block text-sm font-medium text-gray-700 mb-1">
                    Metadata
                  </label>
                  <textarea
                    id="metadata"
                    value={metadata}
                    onChange={(e) => setMetadata(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-black border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors duration-200"
                  >
                    Mint
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default CreateTokenModal