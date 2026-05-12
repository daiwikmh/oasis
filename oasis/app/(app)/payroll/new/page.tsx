"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload, Check, X, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { usePayrollStore } from "@/stores/payrollStore";
import { useSaveBatch } from "@/hooks/useBatches";
import { useExecuteBatch } from "@/hooks/useExecuteBatch";
import { parsePayrollCsv, type Frequency } from "@/lib/api/payroll";
import { isValidSolanaAddress } from "@/lib/utils/validators";

export default function NewBatchPage() {
  const router = useRouter();
  const draft = usePayrollStore((s) => s.draft);
  const setName = usePayrollStore((s) => s.setDraftName);
  const setFrequency = usePayrollStore((s) => s.setDraftFrequency);
  const addEmployee = usePayrollStore((s) => s.addEmployee);
  const removeEmployee = usePayrollStore((s) => s.removeEmployee);
  const updateEmployee = usePayrollStore((s) => s.updateEmployee);
  const reset = usePayrollStore((s) => s.resetDraft);

  const fileInput = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [executing, setExecuting] = useState(false);

  const save = useSaveBatch();
  const exec = useExecuteBatch();

  const total = draft.employees.reduce((s, e) => s + parseFloat(e.amountPusd || "0"), 0);
  const validEmployees = draft.employees.filter(
    (e) => e.name && e.amountPusd && (e.walletAddress ? isValidSolanaAddress(e.walletAddress) : false),
  );
  const canSubmit = draft.name && validEmployees.length > 0 && validEmployees.length === draft.employees.length;

  async function handleCsv(file: File) {
    const text = await file.text();
    const parsed = parsePayrollCsv(text);
    parsed.forEach((emp) => addEmployee(emp));
  }

  async function submit() {
    if (!canSubmit) return;
    const id = `b_${Date.now()}`;
    const batch = {
      id,
      name: draft.name!,
      frequency: (draft.frequency ?? "once") as Frequency,
      employees: draft.employees,
      runsCompleted: 0,
      createdAt: new Date().toISOString(),
    };
    setExecuting(true);
    try {
      await save.mutateAsync(batch);
      if (batch.frequency === "once") {
        await exec.run(draft.employees);
      } else {
        reset();
        router.push("/payroll");
      }
    } finally {
      setExecuting(false);
    }
  }

  if (exec.progress.length > 0) {
    return <BatchProgress progress={exec.progress} running={exec.running} onDone={() => { reset(); exec.reset(); router.push("/payroll"); }} />;
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">New payroll batch</h1>
        <button onClick={() => router.back()} className="text-muted hover:text-ink p-2">
          <X size={20} />
        </button>
      </div>

      <Card>
        <Input
          label="Batch name"
          placeholder="January 2026 Salaries"
          value={draft.name ?? ""}
          onChange={(e) => setName(e.target.value)}
        />
      </Card>

      <Card>
        <p className="text-sm font-semibold text-ink mb-3">Frequency</p>
        <Tabs value={draft.frequency ?? "once"} onValueChange={(v) => setFrequency(v as Frequency)}>
          <TabsList>
            <TabsTrigger value="once">Once</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="biweekly">Bi-weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
        {draft.frequency && draft.frequency !== "once" && (
          <p className="text-muted text-xs mt-3">
            Recurring batches save and remind you on next page load when due. No background scheduler in v1.
          </p>
        )}
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-ink">Employees</p>
          <Badge variant="soft">{draft.employees.length} / 100</Badge>
        </div>

        <div
          onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) handleCsv(f);
          }}
          className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
            dragOver ? "border-lime bg-lime/10" : "border-hairline"
          }`}
        >
          <Upload size={20} className="mx-auto text-muted" />
          <p className="text-sm text-ink mt-2">Drop CSV or</p>
          <button
            onClick={() => fileInput.current?.click()}
            className="text-cyan font-semibold text-sm hover:underline mt-1"
          >
            choose a file
          </button>
          <p className="text-xs text-muted mt-2">CSV format: name, walletAddress, amountPusd</p>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleCsv(f);
            }}
          />
        </div>

        {draft.employees.map((emp, i) => {
          const addrInvalid = emp.walletAddress && !isValidSolanaAddress(emp.walletAddress);
          return (
            <Card key={emp.id} className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input
                  placeholder="Name"
                  value={emp.name}
                  onChange={(e) => updateEmployee(emp.id, { name: e.target.value })}
                />
                <Input
                  placeholder="Wallet address"
                  value={emp.walletAddress ?? ""}
                  onChange={(e) => updateEmployee(emp.id, { walletAddress: e.target.value.trim() })}
                  error={addrInvalid ? "Invalid address" : undefined}
                />
                <Input
                  placeholder="Amount PUSD"
                  inputMode="decimal"
                  value={emp.amountPusd}
                  onChange={(e) =>
                    updateEmployee(emp.id, { amountPusd: e.target.value.replace(/[^\d.]/g, "") })
                  }
                />
              </div>
              <button
                onClick={() => removeEmployee(emp.id)}
                className="text-danger text-xs flex items-center gap-1 hover:underline"
              >
                <Trash2 size={12} />
                Remove row {i + 1}
              </button>
            </Card>
          );
        })}

        <Button
          variant="ghost"
          className="w-full"
          onClick={() =>
            addEmployee({
              id: `emp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
              name: "",
              walletAddress: "",
              amountPusd: "",
              status: "pending",
            })
          }
        >
          <Plus size={16} />
          Add employee
        </Button>
      </div>

      <Card tone="dark" className="sticky bottom-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-inverse/60 text-xs uppercase tracking-wide">Total payout</p>
            <p className="text-2xl font-bold text-inverse">
              ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <Button
            disabled={!canSubmit || executing}
            onClick={submit}
            className="shrink-0"
          >
            {executing
              ? "Running..."
              : draft.frequency === "once"
              ? "Sign & execute"
              : "Schedule"}
          </Button>
        </div>
      </Card>
    </main>
  );
}

function BatchProgress({
  progress,
  running,
  onDone,
}: {
  progress: ReturnType<typeof useExecuteBatch>["progress"];
  running: boolean;
  onDone: () => void;
}) {
  const completed = progress.filter((e) => e.status === "confirmed").length;
  const failed = progress.filter((e) => e.status === "failed").length;
  const pct = progress.length ? Math.round((completed / progress.length) * 100) : 0;

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-4">
      <h1 className="text-2xl font-bold text-ink">
        {running ? "Executing payroll..." : "Payroll complete"}
      </h1>

      <Card tone="lime">
        <p className="text-ink/70 text-xs uppercase tracking-wide">Progress</p>
        <p className="text-3xl font-bold text-ink mt-1">
          {completed} / {progress.length}
        </p>
        <div className="h-2 bg-ink/15 rounded-full mt-3 overflow-hidden">
          <div className="h-full bg-ink transition-all" style={{ width: `${pct}%` }} />
        </div>
        {failed > 0 && (
          <p className="text-danger text-xs mt-2 font-semibold">
            {failed} failed
          </p>
        )}
      </Card>

      <div className="space-y-2">
        {progress.map((e) => {
          const Icon =
            e.status === "confirmed"
              ? Check
              : e.status === "failed"
              ? X
              : Clock;
          const tone =
            e.status === "confirmed"
              ? "text-success"
              : e.status === "failed"
              ? "text-danger"
              : "text-muted";
          return (
            <Card key={e.id} className="flex items-center gap-3">
              <Icon size={18} className={tone} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{e.name}</p>
                <p className="text-xs text-muted">${e.amountPusd} PUSD</p>
                {e.error && <p className="text-danger text-xs mt-0.5">{e.error}</p>}
              </div>
            </Card>
          );
        })}
      </div>

      {!running && (
        <Button className="w-full" onClick={onDone}>
          Done
        </Button>
      )}
    </main>
  );
}
