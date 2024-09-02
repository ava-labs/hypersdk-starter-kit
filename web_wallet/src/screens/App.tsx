import { useEffect, useState } from 'react'
import ConnectWallet from './ConnectWallet'
import Wallet from './Wallet'
import { morpheusClient } from '../MorpheusClient'
import Faucet from "./Faucet.tsx"
import { pubKeyToED25519Addr } from 'sample-metamask-snap-for-hypersdk/src/bech32'

function App() {
  const [signerConnected, setSignerConnected] = useState<boolean>(false)
  const [myAddr, setMyAddr] = useState<string>("")

  useEffect(() => {
    const handleSignerConnected = (event: CustomEvent) => {
      setSignerConnected(!!event.detail)
      const signer: SignerIface | null = event.detail
      if (signer) {
        setMyAddr(pubKeyToED25519Addr(signer.getPublicKey(), morpheusClient.HRP))
      } else {
        setMyAddr("")
      }
    }

    morpheusClient.addEventListener('signerConnected', handleSignerConnected)

    return () => morpheusClient.removeEventListener('signerConnected', handleSignerConnected)
  }, [])

  if (!signerConnected) {
    return <ConnectWallet />
  }

  return (
    <Faucet myAddr={myAddr} minBalance={morpheusClient.fromFormattedBalance("1")}>
      <Wallet myAddr={myAddr} />
    </Faucet>
  )
}

export default App
