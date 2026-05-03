'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import ThinkingTerminal from '../components/ThinkingTerminal'
import TransactionForm from '../components/TransactionForm'
import VaultStatus from '../components/VaultStatus'
import ConnectButton from '../components/ConnectButton'
import AuditLog from '../components/AuditLog'

const VAULT_ADDRESS = '0x84e57567758B1143BD285eED2cbD574187a1D710'
const CHAIN_ID = 16602
const DEPLOYER = '0x445bf5fe58f2Fe5009eD79cFB1005703D68cbF85'

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
            <p className="text-xs text-zinc-500">
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

        <div className="rounded border border-zinc-800 bg-zinc-950 p-4 space-y-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">What This Is</p>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Parellax takes a natural-language financial intent and executes it through a
            three-stage verifiable pipeline. The AI decision runs inside a Trusted Execution
            Environment — no operator can tamper with the output. The vault contract enforces
            authorization on-chain. Every action, approved or rejected, is written to
            decentralized storage that no one can edit after the fact.
          </p>
          <div className="grid grid-cols-3 gap-3 pt-1">
            <InfoCell
              label="TEE Inference"
              value="Sealed enclave"
              sub="qwen-2.5-7b via 0G Compute"
            />
            <InfoCell
              label="Spending Limits"
              value="0G KV Storage"
              sub="User-sovereign, not a DB"
            />
            <InfoCell
              label="Enforcement"
              value="On-chain vault"
              sub="ECDSA-gated, no admin bypass"
            />
          </div>
        </div>

        <div className="rounded border border-zinc-800 bg-zinc-950 p-4 space-y-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Deployed Contract</p>
          <div className="space-y-2">
            <Row label="ParellaxVault" value={VAULT_ADDRESS} mono />
            <Row label="verifiedBrain" value={DEPLOYER} mono />
            <Row label="Network" value={`0G Galileo — Chain ID ${CHAIN_ID}`} />
            <Row label="RPC" value="https://evmrpc-testnet.0g.ai" mono />
          </div>
        </div>

        <div className="rounded border border-zinc-800 bg-zinc-950 p-4 space-y-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">0G Infrastructure</p>
          <div className="space-y-2">
            <Row label="Storage Indexer" value="https://indexer-storage-testnet-turbo.0g.ai" mono />
            <Row label="KV Stream" value="ethers.id('parellax.v1')" mono />
            <Row label="Flow Contract" value="0x22E03a6A89B950F1c82ec5e74F8eCa321a105296" mono />
            <Row label="Compute Router" value="https://router-api-testnet.integratenetwork.work/v1" mono />
            <Row label="TEE Model" value="qwen/qwen-2.5-7b-instruct" mono />
          </div>
        </div>

        <div className="rounded border border-zinc-800 bg-zinc-950 p-4 space-y-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Open Source Packages</p>
          <p className="text-xs text-zinc-600">
            The storage and compute layers are published as standalone npm packages. Use them
            in any Node.js or Next.js project that needs 0G KV or TEE inference.
          </p>
          <div className="space-y-3">
            <PackageBlock
              name="@daiwikdomain/parellax-storage"
              version="0.1.1"
              description="0G KV wrapper — spending limits and append-only audit logs"
              exports={['setSpendingLimit', 'getSpendingLimit', 'appendAuditLog', 'getAuditLog']}
            />
            <PackageBlock
              name="@daiwikdomain/parellax-compute"
              version="0.1.1"
              description="0G Compute TEE wrapper — verifiable LLM transaction evaluation"
              exports={['evaluateTransaction']}
            />
          </div>
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

function InfoCell({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] text-zinc-600 uppercase tracking-wider">{label}</p>
      <p className="text-xs text-zinc-300">{value}</p>
      <p className="text-[10px] text-zinc-600">{sub}</p>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-[10px] text-zinc-600 shrink-0 pt-0.5">{label}</span>
      <span className={`text-[10px] text-zinc-400 text-right break-all ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  )
}

function PackageBlock({
  name,
  version,
  description,
  exports: fns,
}: {
  name: string
  version: string
  description: string
  exports: string[]
}) {
  return (
    <div className="rounded border border-zinc-900 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-emerald-400 font-mono">{name}</span>
        <span className="text-[10px] text-zinc-600">v{version}</span>
      </div>
      <p className="text-[10px] text-zinc-600">{description}</p>
      <div className="rounded bg-[#0a0a0a] px-3 py-2 text-[10px] text-zinc-400 font-mono">
        npm install {name}
      </div>
      <div className="flex flex-wrap gap-1 pt-0.5">
        {fns.map(fn => (
          <span key={fn} className="rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-500 font-mono">
            {fn}()
          </span>
        ))}
      </div>
    </div>
  )
}
