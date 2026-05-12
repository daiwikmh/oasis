"use client";

import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STORES = [
  { name: "Newegg", url: "https://newegg.com", note: "Electronics, accepts crypto" },
  { name: "Travala", url: "https://travala.com", note: "Hotels & flights with crypto" },
  { name: "Shopify (crypto)", url: "https://shopify.com", note: "Curated PUSD-friendly stores" },
];

export default function ShoppingPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Shopping</h1>
        <Badge variant="lime">Coming soon</Badge>
      </div>

      <Card tone="lime">
        <p className="text-lg font-semibold text-ink">Curated stores accepting PUSD</p>
        <p className="text-ink/70 text-sm mt-1">
          Click through to external partners. Order tracking lands in v2.
        </p>
      </Card>

      <Card className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink font-semibold">My orders</p>
          <p className="text-xs text-muted">No orders yet.</p>
        </div>
        <span className="text-muted">›</span>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {STORES.map((s) => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className="block"
          >
            <Card className="hover:bg-canvas-alt transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{s.name}</p>
                  <p className="text-xs text-muted mt-1">{s.note}</p>
                </div>
                <ExternalLink size={16} className="text-muted shrink-0" />
              </div>
            </Card>
          </a>
        ))}
      </div>
    </main>
  );
}
