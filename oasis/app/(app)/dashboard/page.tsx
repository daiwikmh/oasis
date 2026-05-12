"use client";

import { useState } from "react";
import Link from "next/link";
import { BalanceCard } from "@/components/wallet/BalanceCard";
import { QuickActions } from "@/components/wallet/QuickActions";
import { TxRow } from "@/components/wallet/TxRow";
import { SendDialog } from "@/components/wallet/SendDialog";
import { ReceiveDialog } from "@/components/wallet/ReceiveDialog";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/hooks/useTransactions";

export default function HomePage() {
  const [sendOpen, setSendOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const { data: txs, isLoading } = useTransactions(5);

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <BalanceCard />
      <QuickActions onSend={() => setSendOpen(true)} onReceive={() => setReceiveOpen(true)} />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">Recent activity</h2>
          <Link href="/stats" className="text-sm text-muted hover:text-ink">
            See all ›
          </Link>
        </div>
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        )}
        {!isLoading && (!txs || txs.length === 0) && (
          <Card>
            <p className="text-muted text-sm">No PUSD activity yet.</p>
          </Card>
        )}
        {!isLoading && txs && txs.length > 0 && (
          <div className="space-y-2">
            {txs.map((tx) => (
              <TxRow key={tx.hash} tx={tx} />
            ))}
          </div>
        )}
      </section>

      <SendDialog open={sendOpen} onOpenChange={setSendOpen} />
      <ReceiveDialog open={receiveOpen} onOpenChange={setReceiveOpen} />
    </main>
  );
}
