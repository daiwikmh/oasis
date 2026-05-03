'use client'

import { useEffect, useState } from 'react'

interface AuditEntry {
  ts: number
  intent: string
  decision: 'approved' | 'rejected'
  verificationId: string
  txHash?: string
}

interface Props {
  walletAddr: string
  refreshTick: number
}

export default function AuditLog({ walletAddr, refreshTick }: Props) {
  const [log, setLog] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/audit?wallet=${walletAddr}`)
      .then(r => r.json())
      .then(d => setLog((d.log ?? []).slice().reverse()))
      .catch(() => setLog([]))
      .finally(() => setLoading(false))
  }, [walletAddr, refreshTick])

  if (loading) {
    return (
      <div className="rounded border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-600 animate-pulse">
        Loading audit log from 0G KV...
      </div>
    )
  }

  if (log.length === 0) {
    return (
      <div className="rounded border border-zinc-800 bg-zinc-950 p-4 text-xs text-zinc-600">
        No entries yet. Execute a transaction to populate the log.
      </div>
    )
  }

  return (
    <div className="rounded border border-zinc-800 bg-zinc-950 divide-y divide-zinc-900 max-h-64 overflow-y-auto">
      {log.map((entry, i) => (
        <div key={i} className="p-3 space-y-1">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${entry.decision === 'approved' ? 'text-emerald-400' : 'text-red-400'}`}>
              {entry.decision.toUpperCase()}
            </span>
            <span className="text-[10px] text-zinc-600">
              {new Date(entry.ts).toLocaleTimeString()}
            </span>
          </div>
          <div className="text-xs text-zinc-300 truncate">{entry.intent}</div>
          <div className="text-[10px] text-zinc-600 font-mono truncate">
            id: {entry.verificationId}
          </div>
          {entry.txHash && (
            <div className="text-[10px] text-zinc-500 font-mono truncate">
              tx: {entry.txHash}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
