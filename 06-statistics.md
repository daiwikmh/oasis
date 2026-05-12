# 06 — Statistics

**Platform: web (Next.js 15 App Router).** See spec 01. Module is platform-neutral.

> Goal: ship the Statistics page matching reference image 1 — period pills, Earning lime card, Spending dark card with cyan radar, and a paired bar chart by month.

**Note:** Step body uses RN imports; the web port is a straight swap to `<div>` + Tailwind. Charts use `recharts` (not `react-native-gifted-charts`).

## Prereqs
- `01`–`05`

## Acceptance criteria
- Period pills (Today/Weekly/Monthly/Yearly) switch the active dataset
- Earning + Spending cards show real aggregated numbers from on-chain history
- Bar chart shows monthly inflow vs outflow for the trailing 6 months
- Tooltip on bar hover (desktop) / tap (mobile web) with formatted amount

---

## Step 1 — Aggregation hook

`hooks/useStatsAggregate.ts`:
```ts
import { useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";

export type Period = "today" | "weekly" | "monthly" | "yearly";

const RANGE = {
  today:   24 * 60 * 60 * 1000,
  weekly:  7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
  yearly:  365 * 24 * 60 * 60 * 1000,
} as const;

export function useStatsAggregate(period: Period) {
  const { data: txs = [] } = useTransactions(200);
  return useMemo(() => {
    const now = Date.now();
    const cutoff = now - RANGE[period];
    const inRange = txs.filter((t) => t.timestamp >= cutoff);

    const earned = inRange.filter((t) => t.direction === "in")
      .reduce((s, t) => s + t.amount, 0n);
    const spent = inRange.filter((t) => t.direction === "out")
      .reduce((s, t) => s + t.amount, 0n);

    // Previous period for "vs last X" comparison
    const prevCutoffStart = cutoff - RANGE[period];
    const prev = txs.filter((t) => t.timestamp >= prevCutoffStart && t.timestamp < cutoff);
    const prevEarned = prev.filter((t) => t.direction === "in").reduce((s, t) => s + t.amount, 0n);
    const earningChangePct = prevEarned > 0n
      ? Number(((earned - prevEarned) * 100n) / prevEarned)
      : 0;

    // Monthly buckets for bar chart (last 6 months)
    const months: { month: string; in: bigint; out: bigint }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
      const slice = txs.filter((t) => t.timestamp >= start && t.timestamp < end);
      months.push({
        month: d.toLocaleString("en", { month: "short" }).toUpperCase(),
        in: slice.filter((t) => t.direction === "in").reduce((s, t) => s + t.amount, 0n),
        out: slice.filter((t) => t.direction === "out").reduce((s, t) => s + t.amount, 0n),
      });
    }

    return { earned, spent, earningChangePct, months };
  }, [txs, period]);
}
```

## Step 2 — Period tabs

`components/stats/PeriodTabs.tsx`:
```tsx
import { View } from "react-native";
import { Pill } from "@/components/ui/Pill";
import type { Period } from "@/hooks/useStatsAggregate";

const ITEMS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];

export function PeriodTabs({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <View className="flex-row bg-surface rounded-full p-1 self-start gap-1">
      {ITEMS.map((it) => (
        <Pill key={it.key} active={value === it.key} onPress={() => onChange(it.key)}>
          {it.label}
        </Pill>
      ))}
    </View>
  );
}
```

## Step 3 — Earning card

`components/stats/EarningCard.tsx`:
```tsx
import { View, Text } from "react-native";
import { TrendingUp, MoreHorizontal } from "lucide-react-native";
import { Card } from "@/components/ui/Card";

export function EarningCard({ pct, goalCurrent, goalTarget }: {
  pct: number; goalCurrent: number; goalTarget: number;
}) {
  const progressPct = Math.min(100, Math.round((goalCurrent / goalTarget) * 100));
  return (
    <Card tone="lime" className="flex-1">
      <View className="flex-row justify-between">
        <View className="flex-row items-center gap-1">
          <TrendingUp size={14} color="#0E1410" />
          <Text className="text-ink font-semi text-xs">Earning</Text>
        </View>
        <MoreHorizontal size={16} color="#0E1410" />
      </View>
      <Text className="text-h1 mt-3">{pct}%</Text>
      <Text className="text-ink/70 text-xs mt-2 leading-4">
        Your current month earning is {pct >= 0 ? "increased" : "decreased"} by {Math.abs(pct)}% compared to last month.
      </Text>
      <View className="mt-4">
        <Text className="text-ink/70 text-xs">Goal ${goalCurrent}/${goalTarget}</Text>
        <View className="flex-row mt-1.5 gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <View key={i}
              className={`flex-1 h-1.5 rounded-full ${i / 12 * 100 < progressPct ? "bg-ink" : "bg-ink/20"}`} />
          ))}
        </View>
      </View>
    </Card>
  );
}
```

## Step 4 — Spending card

`components/stats/SpendingCard.tsx`:
```tsx
import { View, Text } from "react-native";
import { TrendingDown, MoreHorizontal } from "lucide-react-native";
import Svg, { Polygon, Circle } from "react-native-svg";
import { Card } from "@/components/ui/Card";
import { formatRaw } from "@/lib/chains/solana";

function RadarDecor() {
  return (
    <Svg width={90} height={90} viewBox="-50 -50 100 100" style={{ alignSelf: "center" }}>
      {[40, 30, 20, 10].map((r, i) => (
        <Polygon
          key={i}
          points={`0,-${r} ${r},0 0,${r} -${r},0`}
          fill="none"
          stroke="#5DC9C1"
          strokeOpacity={0.6 - i * 0.1}
          strokeWidth={1}
        />
      ))}
      <Circle r={3} fill="#C8F560" />
    </Svg>
  );
}

export function SpendingCard({ raw }: { raw: bigint }) {
  return (
    <Card tone="dark" className="flex-1">
      <View className="flex-row justify-between">
        <View className="flex-row items-center gap-1">
          <TrendingDown size={14} color="#F5FFE0" />
          <Text className="text-inverse font-semi text-xs">Spending</Text>
        </View>
        <MoreHorizontal size={16} color="#F5FFE0" />
      </View>
      <Text className="text-h2 text-inverse mt-3">${formatRaw(raw)}</Text>
      <View className="my-2"><RadarDecor /></View>
      <View className="flex-row gap-3 mt-2">
        <View className="flex-row items-center gap-1">
          <View className="w-2 h-2 rounded-full bg-cyan" />
          <Text className="text-inverse/70 text-[10px]">Debit Card</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <View className="w-2 h-2 rounded-full bg-lime" />
          <Text className="text-inverse/70 text-[10px]">Credit Card</Text>
        </View>
      </View>
    </Card>
  );
}
```

## Step 5 — Bar chart

`components/stats/BarChart.tsx`:
```tsx
import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Card } from "@/components/ui/Card";
import { formatRaw } from "@/lib/chains/solana";

interface MonthData { month: string; in: bigint; out: bigint; }

export function BarChart({ data }: { data: MonthData[] }) {
  const [tip, setTip] = useState<{ idx: number; value: bigint } | null>(null);

  const max = data.reduce((m, d) => {
    const v = d.in > d.out ? d.in : d.out;
    return v > m ? v : m;
  }, 1n);

  const heightFor = (v: bigint) => Number((v * 100n) / max);

  return (
    <Card>
      <View className="flex-row justify-between items-baseline mb-4">
        <View>
          <Text className="text-muted text-xs">Total Balance</Text>
          <Text className="text-h2">$25,453.00</Text>
        </View>
        <View className="gap-1">
          <View className="flex-row items-center gap-1">
            <View className="w-2 h-2 rounded-full bg-lime" />
            <Text className="text-muted text-[10px]">Debit Spending</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="w-2 h-2 rounded-full bg-ink" />
            <Text className="text-muted text-[10px]">Credit Spending</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 160 }} className="flex-row items-end justify-between">
        {data.map((d, idx) => (
          <Pressable
            key={d.month}
            onPress={() => setTip({ idx, value: d.in })}
            className="items-center"
            style={{ width: `${100 / data.length}%` }}
          >
            <View className="flex-row items-end gap-1 h-full">
              <View style={{ width: 8, height: `${heightFor(d.in)}%` }}
                    className="bg-lime rounded-t-md" />
              <View style={{ width: 8, height: `${heightFor(d.out)}%` }}
                    className="bg-ink rounded-t-md" />
            </View>
            {tip?.idx === idx && (
              <View className="absolute -top-8 bg-ink rounded-md px-2 py-1">
                <Text className="text-inverse text-[10px]">${formatRaw(tip.value)}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      <View className="flex-row justify-between mt-2">
        {data.map((d) => (
          <Text key={d.month} className="text-muted text-[10px]" style={{ width: `${100 / data.length}%`, textAlign: "center" }}>
            {d.month}
          </Text>
        ))}
      </View>
    </Card>
  );
}
```

## Step 6 — Statistics screen

`app/(tabs)/statistics.tsx`:
```tsx
import { useState } from "react";
import { ScrollView, View, Text, Pressable } from "react-native";
import { SlidersHorizontal } from "lucide-react-native";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { PeriodTabs } from "@/components/stats/PeriodTabs";
import { EarningCard } from "@/components/stats/EarningCard";
import { SpendingCard } from "@/components/stats/SpendingCard";
import { BarChart } from "@/components/stats/BarChart";
import { useStatsAggregate, type Period } from "@/hooks/useStatsAggregate";

export default function Statistics() {
  const [period, setPeriod] = useState<Period>("monthly");
  const stats = useStatsAggregate(period);

  return (
    <ScreenContainer padded={false}>
      <View className="px-5">
        <Header title="Statistics" />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
        <View className="my-3"><PeriodTabs value={period} onChange={setPeriod} /></View>

        <View className="flex-row gap-3">
          <EarningCard
            pct={stats.earningChangePct}
            goalCurrent={Math.round(Number(stats.earned) / 1e6)}
            goalTarget={1000}
          />
          <SpendingCard raw={stats.spent} />
        </View>

        <View className="flex-row justify-between items-center mt-6 mb-3">
          <Text className="text-h3">Overview</Text>
          <Pressable className="bg-surface rounded-full w-10 h-10 items-center justify-center">
            <SlidersHorizontal size={18} color="#0E1410" />
          </Pressable>
        </View>

        <BarChart data={stats.months.map((m) => ({ month: m.month, in: m.in, out: m.out }))} />
      </ScrollView>
    </ScreenContainer>
  );
}
```

## Done when
- Switching period tabs updates earning/spending values
- Bar chart heights scale to the largest month
- Tapping a bar shows the tooltip
- Empty state (no transactions) doesn't crash; numbers show 0
