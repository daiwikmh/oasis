"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatPusd } from "@/lib/tokens/pusd";
import { shortenAddress } from "@/lib/utils/validators";
import type { TokenTransfer } from "@/lib/chains/types";

export function TxRow({ tx }: { tx: TokenTransfer }) {
  const isOut = tx.direction === "out";
  const Icon = isOut ? ArrowUpRight : ArrowDownLeft;
  const counterparty = isOut ? tx.to : tx.from;
  const date = new Date(tx.timestamp);
  const dateLabel = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <Card className="flex items-center gap-3">
      <span className="w-10 h-10 rounded-full bg-ink flex items-center justify-center shrink-0">
        <Icon size={18} className="text-inverse" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">
          {isOut ? "Sent" : "Received"}
        </p>
        <p className="text-xs text-muted truncate font-mono">
          {shortenAddress(counterparty, 4)} · {dateLabel}
        </p>
      </div>
      <span className={`text-sm font-semibold ${isOut ? "text-ink" : "text-success"}`}>
        {isOut ? "−" : "+"}${formatPusd(tx.amount)}
      </span>
    </Card>
  );
}
