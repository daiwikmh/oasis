"use client";

import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useBatches } from "@/hooks/useBatches";

export default function PayrollPage() {
  const { data: batches, isLoading } = useBatches();
  const totalThisMonth = (batches ?? [])
    .filter((b) => new Date(b.createdAt).getMonth() === new Date().getMonth())
    .reduce(
      (sum, b) => sum + b.employees.reduce((s, e) => s + parseFloat(e.amountPusd || "0"), 0),
      0,
    );

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Payroll</h1>
        <Link href="/payroll/new">
          <Button>
            <Plus size={18} />
            New batch
          </Button>
        </Link>
      </div>

      <Card tone="dark">
        <p className="text-inverse/60 text-xs uppercase tracking-wide">This month</p>
        <p className="text-4xl font-bold text-inverse mt-1">
          ${totalThisMonth.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-inverse/60 text-xs mt-1">
          {batches?.length ?? 0} batch{(batches?.length ?? 0) !== 1 ? "es" : ""} ·{" "}
          {(batches ?? []).reduce((s, b) => s + b.employees.length, 0)} employees
        </p>
      </Card>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      )}

      {!isLoading && (!batches || batches.length === 0) && (
        <Card tone="lime">
          <div className="flex items-start gap-3">
            <div className="bg-ink/10 rounded-xl w-10 h-10 flex items-center justify-center shrink-0">
              <Users size={18} className="text-ink" />
            </div>
            <div>
              <p className="font-semibold text-ink">Run your first payroll</p>
              <p className="text-ink/70 text-sm mt-1">
                Pay your team in PUSD. CSV import, up to 100 employees, one signature per recipient.
              </p>
              <Link href="/payroll/new">
                <Button variant="dark" size="md" className="mt-4">
                  Get started
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {!isLoading && batches && batches.length > 0 && (
        <div className="space-y-2">
          {batches.map((b) => {
            const total = b.employees.reduce((s, e) => s + parseFloat(e.amountPusd || "0"), 0);
            return (
              <Card key={b.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-ink">{b.name}</p>
                    <p className="text-muted text-xs">
                      {b.employees.length} employees · {b.frequency}
                    </p>
                  </div>
                  <Badge variant="soft">{b.frequency}</Badge>
                </div>
                <p className="text-xl font-bold text-ink mt-3">${total.toFixed(2)}</p>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
