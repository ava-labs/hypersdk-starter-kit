import { useEffect, useState } from 'react'
import ConnectWallet from './ConnectWallet'
import Wallet from './Wallet'
import { vmClient } from '../VMClient.ts'
import Faucet from "./Faucet.tsx"
import { pubKeyToED25519Addr } from 'hypersdk-client/src/snap/bech32'
import { SignerIface } from 'hypersdk-client/src/client/types'

// Add this type definition at the top of the file
type SignerConnectedEvent = CustomEvent<SignerIface | null>;

function App() {
  const [signerConnected, setSignerConnected] = useState<boolean>(false)
  const [myAddr, setMyAddr] = useState<string>("")

  useEffect(() => {
    const handleSignerConnected = (event: SignerConnectedEvent) => {
      setSignerConnected(!!event.detail)
      const signer: SignerIface | null = event.detail
      if (signer) {
        setMyAddr(pubKeyToED25519Addr(signer.getPublicKey(), vmClient.HRP))
      } else {
        setMyAddr("")
      }
    }

    vmClient.addEventListener('signerConnected', handleSignerConnected as EventListener)

    return () => vmClient.removeEventListener('signerConnected', handleSignerConnected as EventListener)
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