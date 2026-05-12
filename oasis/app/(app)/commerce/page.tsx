"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ExternalLink, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useBitrefillProducts, type BitrefillProduct } from "@/hooks/useBitrefillProducts";

const TYPES = [
  { value: "",           label: "All" },
  { value: "gift_card",  label: "Gift cards" },
  { value: "refill",     label: "Mobile refills" },
  { value: "esim",       label: "eSIM" },
  { value: "bill",       label: "Bills" },
] as const;

const COUNTRIES = [
  { value: "",   label: "Worldwide" },
  { value: "US", label: "US" },
  { value: "GB", label: "UK" },
  { value: "DE", label: "Germany" },
  { value: "IN", label: "India" },
  { value: "BR", label: "Brazil" },
] as const;

export default function CommercePage() {
  const [query, setQuery]       = useState("");
  const [debounced, setDebounced] = useState("");
  const [type, setType]         = useState<string>("");
  const [country, setCountry]   = useState<string>("US");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading, error } = useBitrefillProducts({
    q:       debounced || undefined,
    type:    type || undefined,
    country: country || undefined,
    limit:   30,
  });

  const products = data?.data ?? [];

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Commerce</h1>
        <Badge variant="lime">Bitrefill catalog</Badge>
      </div>

      <Card tone="dark">
        <div className="flex gap-3 items-start">
          <AlertTriangle size={18} className="text-lime shrink-0 mt-0.5" />
          <div>
            <p className="text-inverse font-semibold text-sm">Bitrefill does not accept PUSD directly.</p>
            <p className="text-inverse/70 text-xs mt-1">
              Browse here, then{" "}
              <Link href="/swap" className="underline underline-offset-2 text-lime">
                swap PUSD to USDC
              </Link>{" "}
              and check out on Bitrefill.
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Amazon, Starbucks, Uber, AT&T..."
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                type === t.value
                  ? "bg-ink text-inverse"
                  : "bg-canvas-alt text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {COUNTRIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCountry(c.value)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                country === c.value
                  ? "bg-lime text-ink"
                  : "bg-canvas-alt text-muted hover:text-ink"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <Card tone="dark">
          <p className="text-inverse text-sm">
            Could not load Bitrefill catalog. {(error as Error).message}
          </p>
        </Card>
      )}

      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      )}

      {!isLoading && !error && products.length === 0 && (
        <Card>
          <p className="text-muted text-sm">No products match. Try a different search or country.</p>
        </Card>
      )}

      {!isLoading && products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}

function ProductCard({ product }: { product: BitrefillProduct }) {
  const href = `https://www.bitrefill.com/buy/${product.id}`;
  const min  = product.range?.min ?? product.denominations?.[0];
  const ccy  = product.range?.currency ?? product.currency ?? "";

  return (
    <a href={href} target="_blank" rel="noreferrer" className="block">
      <Card className="hover:bg-canvas-alt transition-colors h-full">
        <div className="flex items-start justify-between gap-2">
          <div className="bg-canvas-alt rounded-xl w-10 h-10 flex items-center justify-center font-bold text-ink overflow-hidden shrink-0">
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{product.name[0]}</span>
            )}
          </div>
          <ExternalLink size={14} className="text-muted shrink-0" />
        </div>
        <p className="text-sm font-semibold text-ink mt-3 line-clamp-2">{product.name}</p>
        <div className="flex items-center justify-between mt-2">
          {product.country && <p className="text-xs text-muted">{product.country}</p>}
          {min !== undefined && (
            <p className="text-xs text-muted">
              From {min} {ccy}
            </p>
          )}
        </div>
      </Card>
    </a>
  );
}
