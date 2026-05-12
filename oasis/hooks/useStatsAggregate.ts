import { useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { formatPusd } from "@/lib/tokens/pusd";

export type Period = "today" | "weekly" | "monthly" | "yearly";

interface PeriodConfig {
  rangeMs:    number;
  bucketCount: number;
  bucketKey:  (d: Date) => string;
  bucketSeed: () => string[];
  chartLabel: string;
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const PERIODS: Record<Period, PeriodConfig> = {
  today: {
    rangeMs:    24 * HOUR,
    bucketCount: 24,
    bucketKey:  (d) => `${d.getHours().toString().padStart(2, "0")}:00`,
    bucketSeed: () => Array.from({ length: 24 }, (_, i) => {
      const d = new Date();
      d.setHours(d.getHours() - (23 - i), 0, 0, 0);
      return `${d.getHours().toString().padStart(2, "0")}:00`;
    }),
    chartLabel: "Last 24 hours",
  },
  weekly: {
    rangeMs:    7 * DAY,
    bucketCount: 7,
    bucketKey:  (d) => d.toLocaleString("en-US", { weekday: "short" }),
    bucketSeed: () => Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleString("en-US", { weekday: "short" });
    }),
    chartLabel: "Last 7 days",
  },
  monthly: {
    rangeMs:    30 * DAY,
    bucketCount: 30,
    bucketKey:  (d) => `${d.getMonth() + 1}/${d.getDate()}`,
    bucketSeed: () => Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      return `${d.getMonth() + 1}/${d.getDate()}`;
    }),
    chartLabel: "Last 30 days",
  },
  yearly: {
    rangeMs:    365 * DAY,
    bucketCount: 12,
    bucketKey:  (d) => d.toLocaleString("en-US", { month: "short", year: "2-digit" }),
    bucketSeed: () => Array.from({ length: 12 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      return d.toLocaleString("en-US", { month: "short", year: "2-digit" });
    }),
    chartLabel: "Last 12 months",
  },
};

export interface PeriodBar {
  bucket: string;
  earned: bigint;
  spent:  bigint;
}

export function useStatsAggregate(period: Period) {
  const { data: txs = [], isLoading } = useTransactions(500);

  return useMemo(() => {
    const cfg = PERIODS[period];
    const cutoff = Date.now() - cfg.rangeMs;
    const inRange = txs.filter((t) => t.timestamp >= cutoff);

    const earned = inRange.filter((t) => t.direction === "in").reduce((s, t) => s + t.amount, 0n);
    const spent  = inRange.filter((t) => t.direction === "out").reduce((s, t) => s + t.amount, 0n);

    const bucketMap = new Map<string, PeriodBar>();
    cfg.bucketSeed().forEach((b) => bucketMap.set(b, { bucket: b, earned: 0n, spent: 0n }));

    for (const tx of inRange) {
      const key = cfg.bucketKey(new Date(tx.timestamp));
      const bar = bucketMap.get(key);
      if (!bar) continue;
      if (tx.direction === "in") bar.earned += tx.amount;
      else bar.spent += tx.amount;
    }

    return {
      earned,
      spent,
      earnedFormatted: formatPusd(earned),
      spentFormatted:  formatPusd(spent),
      bars:            Array.from(bucketMap.values()),
      chartLabel:      cfg.chartLabel,
      isLoading,
    };
  }, [txs, period, isLoading]);
}
