import { useEffect, useState } from 'react'
import ConnectWallet from './ConnectWallet'
import Wallet from './Wallet'
import { vmClient } from '../VMClient.ts'
import Faucet from "./Faucet.tsx"
import { pubKeyToED25519Addr } from 'sample-metamask-snap-for-hypersdk/src/bech32'
import { SignerIface } from '../../../HyperSDKClient/types.ts'

function App() {
  const [signerConnected, setSignerConnected] = useState<boolean>(false)
  const [myAddr, setMyAddr] = useState<string>("")

  useEffect(() => {
    const handleSignerConnected = (event: CustomEvent) => {
      setSignerConnected(!!event.detail)
      const signer: SignerIface | null = event.detail
      if (signer) {
        setMyAddr(pubKeyToED25519Addr(signer.getPublicKey(), vmClient.HRP))
      } else {
        setMyAddr("")
      }
    }

    vmClient.addEventListener('signerConnected', handleSignerConnected)

    return () => vmClient.removeEventListener('signerConnected', handleSignerConnected)
  }, [])

  if (!signerConnected) {
    return <ConnectWallet />
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Faucet myAddr={myAddr} minBalance={vmClient.fromFormattedBalance("1")}>
        <Wallet myAddr={myAddr} />
      </Faucet>
    </div>
  )
}

export default App
