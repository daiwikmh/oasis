"use client";

import { FormEvent, useState } from "react";

interface Props {
  walletAddr: string;
  onStart: () => void;
  onLine: (line: string) => void;
  onDone: () => void;
}

export default function TransactionForm({ walletAddr, onStart, onLine, onDone }: Props) {
  const [intent, setIntent] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!intent || !amount || !recipient) return;
    setLoading(true);
    onStart();

    try {
      const res = await fetch("/api/transact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent, amountEth: amount, recipient, walletAddr }),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.replace(/^data: /, "").trim();
          if (!line) continue;
          try { onLine(JSON.parse(line).msg); } catch { onLine(line); }
        }
      }
    } catch (err) {
      onLine(`ERROR: ${(err as Error).message}`);
    } finally {
      setLoading(false);
      onDone();
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Intent</label>
        <input
          className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:border-zinc-600 focus:outline-none"
          placeholder='e.g. "Pay the nanny 0.1 OG"'
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs text-zinc-500 mb-1">Amount (OG)</label>
          <input
            className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:border-zinc-600 focus:outline-none"
            placeholder="0.05"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-zinc-500 mb-1">Recipient address</label>
          <input
            className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-700 focus:border-zinc-600 focus:outline-none font-mono text-xs"
            placeholder="0x..."
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-800 disabled:opacity-40 transition-colors"
      >
        {loading ? "Processing..." : "Execute"}
      </button>
    </form>
  );
}
