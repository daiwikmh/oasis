import { useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useEmbeddedSolanaWallet } from "@/lib/privy/sdk";
import { useServerContacts } from "@/hooks/useServerContacts";
import { shortenAddress } from "@/lib/utils/validators";

export interface Contact {
  address: string;
  label:   string;
  txCount: number;
  saved:   boolean;
}

export function useContacts(): Contact[] {
  const { wallets } = useEmbeddedSolanaWallet();
  const myAddress = wallets?.[0]?.address;
  const { data: txs = [] } = useTransactions(100);
  const { data: serverContacts = [] } = useServerContacts();

  return useMemo(() => {
    const freq = new Map<string, number>();
    for (const tx of txs) {
      if (tx.direction !== "out") continue;
      if (tx.to === myAddress) continue;
      freq.set(tx.to, (freq.get(tx.to) ?? 0) + 1);
    }
    const savedByAddr = new Map(serverContacts.map((c) => [c.walletAddress, c]));
    const all = new Map<string, Contact>();
    for (const c of serverContacts) {
      all.set(c.walletAddress, { address: c.walletAddress, label: c.name, txCount: freq.get(c.walletAddress) ?? 0, saved: true });
    }
    for (const [address, txCount] of freq) {
      if (all.has(address)) {
        const existing = all.get(address)!;
        existing.txCount = txCount;
        continue;
      }
      all.set(address, { address, label: shortenAddress(address), txCount, saved: false });
    }
    return Array.from(all.values())
      .sort((a, b) => Number(b.saved) - Number(a.saved) || b.txCount - a.txCount)
      .slice(0, 12);
  }, [txs, myAddress, serverContacts]);
}
