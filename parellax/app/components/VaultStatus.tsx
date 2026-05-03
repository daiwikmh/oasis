'use client'

import { useEffect, useState } from 'react'
import { useSendTransaction } from 'wagmi'
import { parseEther } from 'viem'

interface Props {
  walletAddr: string
  vaultAddress: string
}

export default function VaultStatus({ walletAddr, vaultAddress }: Props) {
  const [limit, setLimit] = useState<string | null>(null)
  const [vaultBalance, setVaultBalance] = useState<string | null>(null)
  const [newLimit, setNewLimit] = useState('')
  const [saving, setSaving] = useState(false)
  const [depositAmt, setDepositAmt] = useState('')

  const { sendTransaction, isPending: depositing } = useSendTransaction()

  useEffect(() => {
    fetch(`/api/settings?wallet=${walletAddr}`)
      .then(r => r.json())
      .then(d => setLimit(d.limit))
      .catch(() => null)

    fetch('/api/vault-balance')
      .then(r => r.json())
      .then(d => setVaultBalance(d.balance))
      .catch(() => null)
  }, [walletAddr])

  async function saveLimit() {
    if (!newLimit) return
    setSaving(true)
    try {
      const limitWei = (parseFloat(newLimit) * 1e18).toString()
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletAddr, limitWei }),
      })
      const d = await res.json()
      if (d.txHash) setLimit(limitWei)
    } finally {
      setSaving(false)
    }
  }

  function deposit() {
    if (!depositAmt) return
    sendTransaction(
      { to: vaultAddress as `0x${string}`, value: parseEther(depositAmt) },
      {
        onSuccess: () => {
          setDepositAmt('')
          setTimeout(() => {
            fetch('/api/vault-balance')
              .then(r => r.json())
              .then(d => setVaultBalance(d.balance))
              .catch(() => null)
          }, 4000)
        },
      }
    )
  }

  const limitOG = limit ? (Number(limit) / 1e18).toFixed(4) : null
  const vaultOG = vaultBalance ? (Number(vaultBalance) / 1e18).toFixed(4) : null

  return (
    <div className="rounded border border-zinc-800 bg-zinc-950 p-4 space-y-4">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">Vault Balance</span>
          <span className="font-mono text-sm text-blue-400">
            {vaultOG != null ? `${vaultOG} OG` : '...'}
          </span>
        </div>
        <div className="text-[10px] text-zinc-700 font-mono truncate">
          {vaultAddress}
        </div>
        <div className="flex gap-2 pt-1">
          <input
            className="flex-1 rounded border border-zinc-800 bg-[#0a0a0a] px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-700 focus:border-zinc-600 focus:outline-none"
            placeholder="Deposit OG"
            value={depositAmt}
            onChange={e => setDepositAmt(e.target.value)}
          />
          <button
            onClick={deposit}
            disabled={depositing || !depositAmt}
            className="rounded border border-blue-800 bg-blue-950 px-3 py-1.5 text-xs text-blue-400 hover:bg-blue-900 disabled:opacity-40 transition-colors"
          >
            {depositing ? 'Sending...' : 'Fund Vault'}
          </button>
        </div>
      </div>

      <div className="border-t border-zinc-900 pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500">Your Spending Limit</span>
          <span className="font-mono text-sm text-emerald-400">
            {limitOG != null ? `${limitOG} OG` : 'not set'}
          </span>
        </div>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded border border-zinc-800 bg-[#0a0a0a] px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-700 focus:border-zinc-600 focus:outline-none"
            placeholder="New limit in OG"
            value={newLimit}
            onChange={e => setNewLimit(e.target.value)}
          />
          <button
            onClick={saveLimit}
            disabled={saving}
            className="rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving...' : 'Save to 0G'}
          </button>
        </div>
      </div>
    </div>
  )
}
