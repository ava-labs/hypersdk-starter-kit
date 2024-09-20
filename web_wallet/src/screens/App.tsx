import { useEffect, useState } from 'react'
import ConnectWallet from './ConnectWallet'
import Wallet from './Wallet'
import Swap from './Swap.tsx'
import Faucet from "./Faucet.tsx"
import Pool from './Pool.tsx'
import { vmClient } from '../VMClient.ts'
import { addressHexFromPubKey } from 'hypersdk-client/src/lib/Marshaler.ts'
import { SignerIface } from 'hypersdk-client/src/client/types'
import { Tab } from '@headlessui/react'

// Add this type definition at the top of the file
type SignerConnectedEvent = CustomEvent<SignerIface | null>;

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

function App() {
  const [signerConnected, setSignerConnected] = useState<boolean>(false)
  const [myAddr, setMyAddr] = useState<string>("")

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

  const [tokenList, setTokenList] = useState<string[]>(['RED', 'USDC', "Add Token"]);

  const handleAddToken = (newToken: string) => {
    setTokenList([...tokenList.slice(0, tokenList.length - 1), newToken, "Add Token"])
  };

  const [categories] = useState({
    'Wallet': [],
    'Swap': [],
    'Pool': []
  })

  if (!signerConnected) {
    return <ConnectWallet />
  } else {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md px-2 py-8 sm:px-0">
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
                      // <Faucet myAddr={myAddr} minBalance={vmClient.fromFormattedBalance("1")}>
                        <Wallet myAddr={myAddr} />
                      // </Faucet>
                    )}
                    {Object.keys(categories)[idx] === 'Swap' && <Swap tokens={tokenList} onAddToken={handleAddToken}/>}
                    {Object.keys(categories)[idx] === 'Pool' && <Pool tokens={tokenList} onAddToken={handleAddToken}/>}
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