import { useEffect, useState } from 'react'
import ConnectWallet from './ConnectWallet'
import Wallet from './Wallet'
import FullScreenError from './FullScreenError'
import { morpheusClient } from './MorpheusClient'

function App() {
  const [errors, setErrors] = useState<string[]>([])

  const [signerConnected, setSignerConnected] = useState<boolean>(false)

  useEffect(() => {
    const handleSignerConnected = (event: CustomEvent) => setSignerConnected(!!event.detail)
    morpheusClient.addEventListener('signerConnected', handleSignerConnected)

    return () => morpheusClient.removeEventListener('signerConnected', handleSignerConnected)
  }, [])


  if (errors.length > 0) {
    return <FullScreenError errors={errors} />
  }

  if (!signerConnected) {
    return <ConnectWallet onSignerInitComplete={newSigner => {
      setSigner(newSigner)
    }} />
  }

  return <Wallet />
}

export default App
