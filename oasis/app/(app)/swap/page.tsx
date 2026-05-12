"use client";

import { useState } from "react";
import { ArrowDownUp, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useJupiterQuote } from "@/hooks/useJupiterQuote";
import { useJupiterSwap } from "@/hooks/useJupiterSwap";
import { PUSD_MINT, USDC_MINT } from "@/lib/solana/jupiter";

const MOONPAY_URL = "https://buy.moonpay.com/?defaultCurrencyCode=usdc_sol";

const TOKENS = [
  { address: PUSD_MINT, symbol: "PUSD", decimals: 6 },
  { address: USDC_MINT, symbol: "USDC", decimals: 6 },
];

export default function SwapPage() {
  const [inputMint, setInputMint] = useState<string>(PUSD_MINT);
  const [outputMint, setOutputMint] = useState<string>(USDC_MINT);
  const [amount, setAmount] = useState("");
  const [slippageBps, setSlippageBps] = useState(50);

  const inTok = TOKENS.find((t) => t.address === inputMint) ?? TOKENS[0];
  const outTok = TOKENS.find((t) => t.address === outputMint) ?? TOKENS[1];

  const amountRaw = amount ? String(BigInt(Math.floor(parseFloat(amount) * 10 ** inTok.decimals))) : undefined;
  const quote = useJupiterQuote({ inputMint, outputMint, amount: amountRaw, slippageBps });
  const swap = useJupiterSwap();

  const outDisplay =
    quote.data && outTok
      ? (Number(quote.data.outAmount) / 10 ** outTok.decimals).toFixed(4)
      : "";

  function flip() {
    setInputMint(outputMint);
    setOutputMint(inputMint);
    setAmount("");
  }

  async function submit() {
    if (!quote.data) return;
    try {
      await swap.swap(quote.data);
    } catch {
      // error inline
    }
  }

  const priceImpact = quote.data ? parseFloat(quote.data.priceImpactPct) : 0;
  const highImpact = priceImpact > 1;
  const blockedImpact = priceImpact > 3;

  return (
    <main className="max-w-xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Swap</h1>
        <Tabs value={String(slippageBps)} onValueChange={(v) => setSlippageBps(Number(v))}>
          <TabsList>
            <TabsTrigger value="10">0.1%</TabsTrigger>
            <TabsTrigger value="50">0.5%</TabsTrigger>
            <TabsTrigger value="100">1%</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-2">
        <Card>
          <p className="text-xs text-muted">From</p>
          <div className="flex items-center justify-between mt-1">
            <Input
              inputMode="decimal"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              className="bg-transparent border-0 px-0 text-2xl font-bold focus:ring-0 focus:border-0"
            />
            <button
              onClick={() => {
                const next = TOKENS.find((t) => t.address !== inputMint)?.address;
                if (next) setInputMint(next);
              }}
              className="bg-canvas-alt rounded-full px-3 py-1.5 text-sm font-semibold"
            >
              {inTok.symbol}
            </button>
          </div>
        </Card>

        <div className="flex justify-center -my-2 z-10 relative">
          <button
            onClick={flip}
            aria-label="Flip"
            className="bg-lime hover:bg-lime-strong text-ink rounded-full w-10 h-10 flex items-center justify-center"
          >
            <ArrowDownUp size={18} />
          </button>
        </div>

        <Card>
          <p className="text-xs text-muted">To</p>
          <div className="flex items-center justify-between mt-1">
            <span className="text-2xl font-bold text-ink">{outDisplay || "0.00"}</span>
            <button
              onClick={() => {
                const next = TOKENS.find((t) => t.address !== outputMint)?.address;
                if (next) setOutputMint(next);
              }}
              className="bg-canvas-alt rounded-full px-3 py-1.5 text-sm font-semibold"
            >
              {outTok.symbol}
            </button>
          </div>
        </Card>
      </div>

      {quote.data && (
        <Card>
          <Row label="Price impact" value={`${priceImpact.toFixed(2)}%`} highlight={highImpact} />
          <Row label="Slippage" value={`${(slippageBps / 100).toFixed(2)}%`} />
          <Row
            label="Route"
            value={quote.data.routePlan.map((r) => r.swapInfo.label).join(" → ")}
          />
        </Card>
      )}

      {swap.error && (
        <p className="text-danger text-xs text-center">{swap.error}</p>
      )}
      {swap.signature && (
        <a
          href={`https://solscan.io/tx/${swap.signature}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 text-sm text-cyan font-medium hover:underline"
        >
          View swap on Solscan <ExternalLink size={14} />
        </a>
      )}

      <Button
        className="w-full"
        size="lg"
        disabled={!quote.data || blockedImpact || swap.status === "pending"}
        onClick={submit}
      >
        {swap.status === "pending"
          ? "Signing..."
          : blockedImpact
          ? "Price impact too high"
          : "Swap"}
      </Button>

      <Card tone="cream" className="border border-hairline">
        <div className="flex items-start gap-3">
          <div className="bg-lime rounded-xl w-10 h-10 flex items-center justify-center shrink-0">
            <ExternalLink size={18} className="text-ink" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-ink text-sm">Need PUSD?</p>
              <Badge variant="lime">v1</Badge>
            </div>
            <p className="text-xs text-muted mt-1">
              Buy USDC with card via MoonPay, then swap to PUSD here.
            </p>
            <a
              href={MOONPAY_URL}
              target="_blank"
              rel="noreferrer"
              className="text-cyan text-xs font-semibold hover:underline mt-2 inline-block"
            >
              Buy USDC →
            </a>
          </div>
        </div>
      </Card>
    </main>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-muted text-sm">{label}</span>
      <span className={`text-sm ${highlight ? "text-warning font-semibold" : "text-ink"}`}>
        {value}
      </span>
    </div>
  );
}
