"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const BRANDS = [
  { name: "Amazon", min: 25, category: "shopping" },
  { name: "Starbucks", min: 10, category: "food" },
  { name: "Uber", min: 25, category: "travel" },
  { name: "Netflix", min: 30, category: "entertainment" },
  { name: "Apple", min: 25, category: "shopping" },
  { name: "Spotify", min: 30, category: "entertainment" },
];

export default function GiftCardsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Gift cards</h1>
        <Badge variant="lime">Coming soon</Badge>
      </div>

      <Card tone="lime">
        <p className="text-lg font-semibold text-ink">Spend PUSD anywhere</p>
        <p className="text-ink/70 text-sm mt-1">
          Buy gift cards from 100+ brands. Launching with a Reloadly / Bitrefill integration.
        </p>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {BRANDS.map((b) => (
          <Card key={b.name}>
            <div className="bg-canvas-alt rounded-xl w-12 h-12 flex items-center justify-center font-bold text-ink">
              {b.name[0]}
            </div>
            <p className="text-sm font-semibold text-ink mt-3">{b.name}</p>
            <p className="text-xs text-muted">From ${b.min}</p>
          </Card>
        ))}
      </div>

      <Card>
        <p className="text-sm text-muted">
          The first 50 brands launch with the gift cards integration. Want a specific brand earlier?
        </p>
        <Button variant="ghost" className="mt-3" disabled>
          Request a brand (coming soon)
        </Button>
      </Card>
    </main>
  );
}
