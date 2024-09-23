"use client"

import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Token } from '../screens/App'
import MintTokenModal from "./MintTokenModal"
interface TokenInfoModalProps {
  token: Token;
}

export default function TokenInfoModal({ token }: TokenInfoModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsOpen(false)
  }


  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 text-sm font-small text-white bg-black rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-105"
      >
     Info
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
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-white rounded-lg p-6 w-full max-w-md m-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Token Info</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <label className="block text-sm font-medium text-gray-700 w-1/3">
                      Token Name
                    </label>
                    <p className="mt-1 block w-2/3 shadow-sm sm:text-sm border-gray-300 rounded-md bg-gray-100 p-2">
                      {token.name}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <label className="block text-sm font-medium text-gray-700 w-1/3">
                      Token Symbol
                    </label>
                    <p className="mt-1 block w-2/3 shadow-sm sm:text-sm border-gray-300 rounded-md bg-gray-100 p-2">
                      {token.symbol}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <label className="block text-sm font-medium text-gray-700 w-1/3">
                      Token Metadata
                    </label>
                    <p className="mt-1 block w-2/3 shadow-sm sm:text-sm border-gray-300 rounded-md bg-gray-100 p-2">
                      {token.metadata}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <label className="block text-sm font-medium text-gray-700 w-1/3">
                      Token Supply
                    </label>
                    <p className="mt-1 block w-2/3 shadow-sm sm:text-sm border-gray-300 rounded-md bg-gray-100 p-2">
                      {token.supply}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <label className="block text-sm font-medium text-gray-700 w-1/3">
                      Token Owner
                    </label>
                    <p className="mt-1 block w-2/3 shadow-sm sm:text-sm border-gray-300 rounded-md bg-gray-100 p-2">
                      {token.owner}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                  >
                    Close
                  </button>
                 <MintTokenModal onMintToken={(amount: string) => { /* handle mint token logic here */ }} />
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}