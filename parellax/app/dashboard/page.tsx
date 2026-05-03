'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import ThinkingTerminal from '../components/ThinkingTerminal'
import TransactionForm from '../components/TransactionForm'
import VaultStatus from '../components/VaultStatus'
import ConnectButton from '../components/ConnectButton'
import AuditLog from '../components/AuditLog'

const VAULT_ADDRESS = '0x84e57567758B1143BD285eED2cbD574187a1D710'

export default function Dashboard() {
  const { address, isConnected } = useAccount()
  const [lines, setLines] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const [auditTick, setAuditTick] = useState(0)

  function handleStart() {
    setLines([])
    setRunning(true)
  }

  function handleLine(line: string) {
    setLines(prev => [...prev, line])
  }

  function handleDone() {
    setRunning(false)
    setAuditTick(t => t + 1)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-mono">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">PARELLAX</h1>
            <p className="text-xs text-zinc-600">
              Verifiable Orchestration Layer for Agentic Banking
            </p>
            <div className="flex gap-4 pt-1">
              <Badge label="0G Storage" />
              <Badge label="0G Compute" />
              <Badge label="0G Chain" />
            </div>
          </div>
          <ConnectButton />
        </div>

        {!isConnected ? (
          <div className="rounded border border-zinc-800 bg-zinc-950 p-8 text-center space-y-3">
            <p className="text-sm text-zinc-400">Connect your wallet to continue</p>
            <p className="text-xs text-zinc-600">
              Make sure MetaMask is on 0G Galileo (chain ID 16602)
            </p>
          </div>
        ) : (
          <>
            <VaultStatus walletAddr={address!} vaultAddress={VAULT_ADDRESS} />

            <div className="space-y-2">
              <h2 className="text-xs text-zinc-500 uppercase tracking-widest">Execute Intent</h2>
              <TransactionForm
                walletAddr={address!}
                onStart={handleStart}
                onLine={handleLine}
                onDone={handleDone}
              />
            </div>

            <div className="space-y-2">
              <h2 className="text-xs text-zinc-500 uppercase tracking-widest">Thinking Terminal</h2>
              <ThinkingTerminal lines={lines} isRunning={running} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xs text-zinc-500 uppercase tracking-widest">
                Audit Log
                <span className="ml-2 text-zinc-700 normal-case">0G KV Storage</span>
              </h2>
              <AuditLog walletAddr={address!} refreshTick={auditTick} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded border border-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
      {label}
    </span>
  )
}
