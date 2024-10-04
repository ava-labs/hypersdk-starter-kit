import { useEffect, useState } from 'react'
import ConnectWallet from './ConnectWallet'
import Wallet from './Wallet'
import Tokens from './Tokens'
import Swap from './Swap.tsx'
import Faucet from "./Faucet.tsx"
import Pool from './Pool.tsx'
import { vmClient, NewTokenBalanceAction } from '../VMClient.ts'
import { Token, TokensProps, LiquidityPair } from '../VMClient.tsx'
import { addressHexFromPubKey } from 'hypersdk-client/src/lib/Marshaler.ts'
import { SignerIface } from 'hypersdk-client/src/client/types'
import { Tab } from '@headlessui/react'
import { TOKEN_ADDRESS } from '../const.ts'
// Add this type definition at the top of the file
type SignerConnectedEvent = CustomEvent<SignerIface | null>;

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

const tokenProps: TokensProps = {
  initialTokens: [
    {
      name: "CFMMVM",
      symbol: "CVM",
      metadata: "A constant-function market-maker VM implementation",
      address: TOKEN_ADDRESS,
      balance: "0",
      totalSupply: '',
      owner: "000000000000000000000000000000000000000000000000000000000000000000"
    }
  ]
};

function App() {
  const [signerConnected, setSignerConnected] = useState<boolean>(false)
  const [myAddr, setMyAddr] = useState<string>("")
  const [tokenList, setTokenList] = useState<Token[]>(tokenProps.initialTokens)
  const [pools, setPools] = useState<LiquidityPair[]>([])

  const handleAddToken = (newToken: Token) => {
    setTokenList([...tokenList, newToken])
  };

  const handleAddPool = (pair: LiquidityPair) => {
    setPools([...pools, pair])
  }
  
  const handleRemovePool = (pair: LiquidityPair) => {
    setPools(pools.filter((p) => p.poolAddress !== pair.poolAddress))
  }

  const handleRefresh = (pools: LiquidityPair[]) => {
    setPools(pools)
  }

  useEffect(() => {
    const handleSignerConnected = (event: SignerConnectedEvent) => {
      setSignerConnected(!!event.detail)
      const signer: SignerIface | null = event.detail
      if (signer) {
        setMyAddr(addressHexFromPubKey(signer.getPublicKey()))
      } else {
        setMyAddr("")
      }
    }

    vmClient.addEventListener('signerConnected', handleSignerConnected as EventListener)

    return () => vmClient.removeEventListener('signerConnected', handleSignerConnected as EventListener)
  }, [])

  useEffect(() => {
    if (myAddr) {
      const fetchBalances = async () => {
        const newTokenList: Token[] = []
        for (const token of tokenList) {
          if (token.address) {
            if (token.address == TOKEN_ADDRESS) {
              const balance = await vmClient.getBalance(myAddr)
              token.balance = vmClient.formatNativeTokens(balance)
            } else {
              const payload = NewTokenBalanceAction(token.address, myAddr)
              const res = await vmClient.simulateAction(payload) as { balance: bigint }
              token.balance = vmClient.formatNativeTokens(res.balance)
            }
          }
          newTokenList.push(token)
        }
        setTokenList(newTokenList)
      }
      fetchBalances()
    }
    
}, [myAddr, tokenList])


  const [categories] = useState({
    'Wallet': [],
    'Tokens': [],
    'Pool': [],
    'Swap': []
  })

  if (!signerConnected) {
    return <ConnectWallet />
  } else {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-5xl px-2 py-8 sm:px-0">
          <Tab.Group>
            <Tab.List className="flex space-x-1 rounded-lg bg-gray-100 p-0.5">
              {Object.keys(categories).map((category) => (
                <Tab
                  key={category}
                  className={({ selected }) =>
                    classNames(
                      'w-full rounded-md py-1.5 text-xs font-medium leading-4',
                      'ring-white ring-opacity-60 ring-offset-1 ring-offset-gray-200 focus:outline-none focus:ring-2',
                      selected
                        ? 'bg-white text-gray-700 shadow-sm'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    )
                  }
                >
                  {category}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels className="mt-2">
              {Object.values(categories).map((_posts, idx) => (
                <Tab.Panel
                  key={idx}
                  className={classNames(
                    'rounded-lg bg-white p-2',
                    'ring-white ring-opacity-60 ring-offset-1 ring-offset-gray-200 focus:outline-none focus:ring-2'
                  )}
                >
                  <div className="text-xs text-gray-500">
                    {Object.keys(categories)[idx] === 'Wallet' && (
                      <Faucet myAddr={myAddr} minBalance={vmClient.convertToNativeTokens("1")}>
                        <Wallet myAddr={myAddr} />
                      </Faucet>
                    )}
                    {Object.keys(categories)[idx] === 'Tokens' && <Tokens myAddr={myAddr} initialTokens={tokenList} onAddToken={handleAddToken}/>}
                    {Object.keys(categories)[idx] === 'Pool' && <Pool tokens={tokenList} myAddr={myAddr} pools={pools} handleAddLiquidity={handleAddPool} handleRemoveLiquidity={handleRemovePool} handleRefresh={handleRefresh}/>}
                    {Object.keys(categories)[idx] === 'Swap' && <Swap tokens={tokenList} pools={pools}/>}
                  </div>
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    )
  }
}

export default App