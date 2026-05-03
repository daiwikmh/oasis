'use client'

import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi'
import { galileo } from '@/lib/wagmi'

export default function ConnectButton() {
  const { address, isConnected, chainId } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()

  const mmConnector = connectors[0]

  const wrongChain = isConnected && chainId !== galileo.id

  if (wrongChain) {
    return (
      <button
        onClick={() => switchChain({ chainId: galileo.id })}
        className="rounded border border-yellow-600 bg-yellow-950 px-3 py-1.5 text-xs text-yellow-400 hover:bg-yellow-900 transition-colors"
      >
        Switch to 0G Galileo
      </button>
    )
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-emerald-400">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <span className="text-xs text-zinc-600">0G Galileo</span>
        <button
          onClick={() => disconnect()}
          className="rounded border border-zinc-800 px-2 py-1 text-xs text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => mmConnector && connect({ connector: mmConnector, chainId: galileo.id })}
      disabled={isPending || !mmConnector}
      className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 transition-colors"
    >
      {isPending ? 'Connecting...' : 'Connect MetaMask'}
    </button>
  )
}
