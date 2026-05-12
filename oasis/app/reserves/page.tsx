"use client";

import Link from "next/link";
import { ChevronLeft, ExternalLink, RefreshCw } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useReserves } from "@/hooks/useReserves";
import { colors } from "@/theme/tokens";

function fmtUsd(value: number | undefined): string {
  if (value === undefined || !Number.isFinite(value)) return "—";
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function fmtDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function fmtShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function TransparencyPage() {
  const { data, isLoading, error, refetch, isRefetching } = useReserves();

  const circulation = data?.circulation;
  const history = data?.history;
  const byChain = circulation?.byChain ?? {};

  const chartData = (history?.points ?? []).map((p) => ({
    date:  fmtShortDate(p.date),
    total: p.total,
  }));

  return (
    <main className="min-h-screen mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" aria-label="Back" className="p-1 -ml-1">
          <ChevronLeft size={22} className="text-ink" />
        </Link>
        <h1 className="text-2xl font-bold text-ink flex-1">Transparency</h1>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          aria-label="Refresh"
          className="p-1.5 rounded-full hover:bg-canvas-alt disabled:opacity-50"
        >
          <RefreshCw size={20} className={isRefetching ? "text-muted" : "text-ink"} />
        </button>
      </div>

      <p className="text-sm text-muted mb-6">
        Live PUSD circulating supply, fetched from Palm&apos;s public circulation API. For the
        full reserves attestation, see{" "}
        <a
          href="https://www.palmusd.com"
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2 hover:text-ink"
        >
          palmusd.com
        </a>
        .
      </p>

      {isLoading && (
        <div className="py-12 flex justify-center">
          <div className="h-8 w-8 rounded-full border-2 border-ink/20 border-t-ink animate-spin" />
        </div>
      )}

      {error && (
        <Card>
          <p className="text-danger text-sm">
            Couldn&apos;t load circulation data. Tap refresh to retry.
          </p>
        </Card>
      )}

      {data && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <p className="text-xs font-semibold uppercase text-muted tracking-wide">
                Circulating supply
              </p>
              <CardTitle className="text-3xl">{fmtUsd(circulation?.total)}</CardTitle>
            </CardHeader>
            {Object.keys(byChain).length > 0 && (
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(byChain).map(([chain, amount]) => (
                    <div key={chain} className="flex justify-between text-sm">
                      <span className="text-muted capitalize">{chain}</span>
                      <span className="font-semibold text-ink">{fmtUsd(amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <p className="text-xs font-semibold uppercase text-muted tracking-wide">
                  Supply history
                </p>
                <CardTitle className="text-base">Last {chartData.length} snapshots</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: "100%", height: 180 }}>
                  <ResponsiveContainer>
                    <AreaChart data={chartData} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="supplyFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={colors.lime} stopOpacity={0.6} />
                          <stop offset="100%" stopColor={colors.lime} stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                        tick={{ fontSize: 11, fill: colors.textMuted }}
                      />
                      <YAxis hide domain={["dataMin", "dataMax"]} />
                      <Tooltip
                        cursor={{ stroke: colors.ink, strokeOpacity: 0.2 }}
                        contentStyle={{
                          borderRadius: 12,
                          border: "none",
                          background: colors.ink,
                          color: colors.textInverse,
                        }}
                        formatter={(value: number) => fmtUsd(value)}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke={colors.lime}
                        strokeWidth={2}
                        fill="url(#supplyFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <a
            href="https://www.palmusd.com"
            target="_blank"
            rel="noreferrer"
            className="block"
          >
            <Card className="flex items-center justify-between hover:bg-canvas-alt transition-colors">
              <div>
                <p className="text-sm text-ink font-semibold">Reserves attestation</p>
                <p className="text-xs text-muted mt-0.5">
                  Proof-of-reserves reports are published on palmusd.com.
                </p>
              </div>
              <ExternalLink size={16} className="text-muted shrink-0" />
            </Card>
          </a>

          <p className="text-xs text-muted text-center">
            Updated {fmtDate(circulation?.updatedAt)}
          </p>
        </div>
      )}
    </main>
  );
}
