"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStatsAggregate, type Period } from "@/hooks/useStatsAggregate";
import { formatPusd } from "@/lib/tokens/pusd";
import { colors } from "@/theme/tokens";

export default function StatsPage() {
  const [period, setPeriod] = useState<Period>("monthly");
  const stats = useStatsAggregate(period);

  const chartData = stats.bars.map((b) => ({
    bucket: b.bucket,
    earned: Number(b.earned) / 1_000_000,
    spent: Number(b.spent) / 1_000_000,
  }));

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Statistics</h1>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card tone="lime">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-ink" />
            <span className="text-xs font-semibold uppercase tracking-wide">Earning</span>
          </div>
          <p className="text-3xl font-bold text-ink mt-2">${stats.earnedFormatted}</p>
          <p className="text-xs text-ink/70 mt-2">
            Inflows over the last {period}.
          </p>
        </Card>

        <Card tone="dark">
          <div className="flex items-center gap-2">
            <TrendingDown size={16} className="text-inverse" />
            <span className="text-xs font-semibold uppercase tracking-wide text-inverse">
              Spending
            </span>
          </div>
          <p className="text-3xl font-bold text-inverse mt-2">${stats.spentFormatted}</p>
          <p className="text-xs text-inverse/70 mt-2">
            Outflows over the last {period}.
          </p>
        </Card>
      </div>

      <Card>
        <p className="text-sm font-semibold text-ink mb-4">{stats.chartLabel}</p>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} barCategoryGap={12}>
              <XAxis
                dataKey="bucket"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: colors.textMuted }}
                interval="preserveStartEnd"
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  background: colors.ink,
                  color: colors.textInverse,
                }}
                formatter={(value: number) => `$${value.toFixed(2)}`}
              />
              <Bar dataKey="earned" fill={colors.lime} radius={[6, 6, 0, 0]} />
              <Bar dataKey="spent" fill={colors.ink} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-3">
          <Legend color={colors.lime} label="Earned" />
          <Legend color={colors.ink} label="Spent" />
        </div>
      </Card>
    </main>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}
