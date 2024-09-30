"use client"

import { useEffect, useState } from 'react'
import CreateTokenModal from '../components/CreateTokenModal'
import TokenInfoModal from '../components/TokenInfoModal'
import { Token } from './App'
import { vmClient, NewTokenBalanceAction } from '../VMClient'
import { TOKEN_ADDRESS } from '../const'
interface TokensProps {
    myAddr: string;
  initialTokens: Token[];
  onAddToken: (token: Token) => void;
}


const Tokens: React.FC<TokensProps> = ({ myAddr, initialTokens, onAddToken }) => {
  const [tokens, setTokens] = useState<Token[]>(initialTokens)

  const addToken = (token: Token) => {
    setTokens([...tokens, token])
    onAddToken(token)
  }

  useEffect(() => {
    try {
      const fetchBalances = async () => {
        const newTokenList: Token[] = []
       for (const token of initialTokens) {
        if (token.address) {
            if (token.address == TOKEN_ADDRESS) {
                const balance = await vmClient.getBalance(myAddr)

                token.balance = vmClient.formatNativeTokens(balance)
            } else {
                const payload = NewTokenBalanceAction(token.address, myAddr)
                const res = await vmClient.simulateAction(payload) as {balance: bigint}
                token.balance = res.balance.toString()
            }
        }
        newTokenList.push(token)
       }
         setTokens(newTokenList)
    }
    fetchBalances()
    }
    catch (e) {
        console.error(e)
    }

  }
    , [myAddr, tokens])

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <h1 className="text-2xl font-bold p-4 border-b">My Token Management</h1>
      < CreateTokenModal myAddr={myAddr} onAddToken={addToken}/>
      <div className="flex-grow overflow-auto p-4">
        <div className="mb-6">
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 font-semibold">TOKEN SYMBOL</th>
                <th scope="col" className="px-6 py-3 font-semibold">ADDRESS</th>
                <th scope="col" className="px-6 py-3 font-semibold">MY BALANCE</th>

              </tr>
            </thead>
            <tbody>
              {tokens.map((token, index) => (
                <tr key={index} className="border-b">
                  <td className="px-6 py-4 font-medium whitespace-nowrap">
                    {token.symbol}
                  </td>
                  <td className="px-6 py-4 font-mono">{token.address}</td>
                  <td className="px-6 py-4 font-mono">
                    {token.balance}
                  </td>
                  <td className="px-6 py-4">
                    <TokenInfoModal token={token} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tokens.length === 0 && (
          <p className="text-center text-gray-500 mt-4">No tokens added yet.</p>
        )}
      </div>
    </div>
  )
}

export default Tokens

