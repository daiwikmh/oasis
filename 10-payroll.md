# 10 — Payroll

**Platform: web (Next.js 15 App Router).** See spec 01. **Payroll is the B2B wedge — desktop is the native surface for this module** (CSV uploads, bulk tables, multi-tab review). Optimize the UX for desktop first; mobile web is acceptable but secondary.

> Goal: ship the B2B payroll module — create batches, add employees manually or via CSV (drag-and-drop), schedule one-time or recurring runs, sign and execute. **Client-only execution for MVP** (admin must have the tab open to fire a recurring batch; backend sequencer is post-MVP).

**Note:** Step body uses `expo-document-picker` + `expo-file-system` + `expo-local-authentication`. Web equivalents: native `<input type="file">` with drag-and-drop, `File.text()`, and Privy passkey (WebAuthn) for confirm. Recurring-batch persistence uses `localStorage` via Zustand `persist` middleware (not `expo-secure-store`).

## Prereqs
- `01`–`07`. Backend (spec 12) stores batch metadata so it persists across devices; execution still happens client-side.

## Acceptance criteria
- Create a batch with up to 100 employees
- CSV import: drag-and-drop, row-level validation, inline error display before commit
- One-time batches execute immediately on confirm; recurring batches save and remind on next page load if `nextRunAt` has passed
- Execution shows per-employee status with retry on failure
- Total cost (sum of payouts + network fees + ATA creation costs) shown before sign
- Desktop layout uses a multi-column employee table; mobile web stacks rows
- Passkey prompt confirms the batch sign before broadcast

---

## Step 1 — Types + store

`lib/api/payroll.ts`:
```ts
export interface EmployeeEntry {
  id: string;          // local uuid
  name: string;
  walletAddress?: string;
  email?: string;
  amountPusd: string;  // human-readable, e.g. "1500.00"
  status?: "pending" | "queued" | "sent" | "confirmed" | "failed";
  signature?: string;
  error?: string;
}

export type Frequency = "once" | "weekly" | "biweekly" | "monthly";

export interface PayrollBatch {
  id: string;
  name: string;
  frequency: Frequency;
  nextRunAt?: string;     // ISO
  endAfterRuns?: number;
  runsCompleted: number;
  employees: EmployeeEntry[];
  createdAt: string;
  status: "draft" | "scheduled" | "running" | "completed" | "failed";
}
```

`stores/payrollStore.ts`:
```ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import type { PayrollBatch, EmployeeEntry, Frequency } from "@/lib/api/payroll";

interface PayrollState {
  draft: Partial<PayrollBatch>;
  setDraft: (p: Partial<PayrollBatch>) => void;
  setEmployees: (e: EmployeeEntry[]) => void;
  setSchedule: (f: Frequency, nextRunAt?: string, endAfterRuns?: number) => void;
  resetDraft: () => void;
}

const secureStorage = {
  getItem: (k: string) => SecureStore.getItemAsync(k),
  setItem: (k: string, v: string) => SecureStore.setItemAsync(k, v),
  removeItem: (k: string) => SecureStore.deleteItemAsync(k),
};

export const usePayrollStore = create<PayrollState>()(
  persist(
    (set) => ({
      draft: { employees: [], runsCompleted: 0, status: "draft" },
      setDraft: (p) => set((s) => ({ draft: { ...s.draft, ...p } })),
      setEmployees: (employees) => set((s) => ({ draft: { ...s.draft, employees } })),
      setSchedule: (frequency, nextRunAt, endAfterRuns) =>
        set((s) => ({ draft: { ...s.draft, frequency, nextRunAt, endAfterRuns } })),
      resetDraft: () => set({ draft: { employees: [], runsCompleted: 0, status: "draft" } }),
    }),
    { name: "oasis.payroll.draft", storage: createJSONStorage(() => secureStorage) }
  )
);
```

## Step 2 — Payroll dashboard

`app/(tabs)/payroll.tsx`:
```tsx
import { ScrollView, View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Card } from "@/components/ui/Card";
import { useBatches } from "@/hooks/usePayroll";
import { Avatar } from "@/components/ui/Avatar";

export default function PayrollDashboard() {
  const { data: batches = [] } = useBatches();
  const totalThisMonth = batches
    .filter((b) => new Date(b.createdAt).getMonth() === new Date().getMonth())
    .reduce((sum, b) => sum + b.employees.reduce((s, e) => s + parseFloat(e.amountPusd), 0), 0);

  return (
    <ScreenContainer padded={false}>
      <View className="flex-row justify-between items-center px-5 py-3">
        <Text className="text-h2">Payroll</Text>
        <Pressable
          onPress={() => router.push("/payroll/new")}
          className="bg-lime rounded-full w-11 h-11 items-center justify-center"
        >
          <Plus size={20} color="#0E1410" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
        <Card tone="dark">
          <Text className="text-inverse/60 text-xs">This month paid out</Text>
          <Text className="text-display text-inverse">${totalThisMonth.toLocaleString()}</Text>
          <Text className="text-inverse/60 text-xs mt-1">
            {batches.length} batch{batches.length !== 1 ? "es" : ""} ·{" "}
            {batches.reduce((s, b) => s + b.employees.length, 0)} employees
          </Text>
        </Card>

        <View className="flex-row gap-2 mt-4">
          {["All", "Active", "Completed", "Drafts"].map((f) => (
            <View key={f} className={`pill ${f === "All" ? "pill-active" : "pill-idle"}`}>
              <Text className={f === "All" ? "text-ink" : "text-muted"}>{f}</Text>
            </View>
          ))}
        </View>

        <View className="mt-4 gap-2">
          {batches.length === 0 ? (
            <Card tone="lime">
              <Text className="text-h3">Run your first payroll</Text>
              <Text className="text-ink/70 mt-1">Pay your team in PUSD. Bulk transfers, one signature.</Text>
              <Pressable
                onPress={() => router.push("/payroll/new")}
                className="bg-ink rounded-full px-4 py-3 self-start mt-4"
              >
                <Text className="text-inverse font-semi">Get started</Text>
              </Pressable>
            </Card>
          ) : (
            batches.map((b) => (
              <Pressable key={b.id} onPress={() => router.push({ pathname: "/payroll/status/[batchId]", params: { batchId: b.id } })}>
                <Card tone={b.status === "running" ? "lime" : "cream"}>
                  <View className="flex-row justify-between">
                    <Text className="text-h3">{b.name}</Text>
                    <Text className="text-muted text-xs">{b.status}</Text>
                  </View>
                  <Text className="text-muted text-xs mt-1">
                    {b.employees.length} employees · {b.frequency}
                  </Text>
                  <View className="flex-row mt-3 -space-x-2">
                    {b.employees.slice(0, 5).map((e, i) => (
                      <View key={e.id} style={{ marginLeft: i === 0 ? 0 : -8 }}>
                        <Avatar name={e.name} size={28} />
                      </View>
                    ))}
                    {b.employees.length > 5 && (
                      <View className="ml-1 bg-canvas-alt rounded-full px-2 py-1">
                        <Text className="text-xs">+{b.employees.length - 5}</Text>
                      </View>
                    )}
                  </View>
                </Card>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
```

## Step 3 — Hooks (backend integration)

`hooks/usePayroll.ts`:
```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/expo";
import type { PayrollBatch } from "@/lib/api/payroll";

const API = process.env.EXPO_PUBLIC_API_URL!;

export function useBatches() {
  const { getAccessToken } = usePrivy();
  return useQuery({
    queryKey: ["payroll-batches"],
    queryFn: async () => {
      const token = await getAccessToken();
      const res = await fetch(`${API}/v1/payroll/batches`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("batches");
      return res.json() as Promise<PayrollBatch[]>;
    },
  });
}

export function useSaveBatch() {
  const { getAccessToken } = usePrivy();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (batch: PayrollBatch) => {
      const token = await getAccessToken();
      const res = await fetch(`${API}/v1/payroll/batches`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(batch),
      });
      if (!res.ok) throw new Error("save batch");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payroll-batches"] }),
  });
}
```

## Step 4 — Create flow: setup

`app/payroll/new.tsx`:
```tsx
import { useState } from "react";
import { View, Text } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/payroll/StepIndicator";
import { usePayrollStore } from "@/stores/payrollStore";

export default function New() {
  const [name, setName] = useState("");
  const setDraft = usePayrollStore((s) => s.setDraft);
  return (
    <ScreenContainer>
      <Header title="New batch" />
      <StepIndicator current={0} steps={["Setup", "Employees", "Schedule", "Review"]} />
      <View className="mt-6 gap-4">
        <Input label="Batch name" placeholder="January 2026 Salaries" value={name} onChangeText={setName} />
        <Text className="text-muted text-xs">Token: PUSD (locked)</Text>
      </View>
      <View className="flex-1" />
      <Button disabled={!name} onPress={() => { setDraft({ name, id: `b_${Date.now()}`, createdAt: new Date().toISOString() }); router.push("/payroll/employees"); }}>
        Continue
      </Button>
    </ScreenContainer>
  );
}
```

## Step 5 — Step indicator component

`components/payroll/StepIndicator.tsx`:
```tsx
import { View, Text } from "react-native";

export function StepIndicator({ current, steps }: { current: number; steps: string[] }) {
  return (
    <View className="flex-row justify-between gap-2">
      {steps.map((s, i) => (
        <View key={s} className={`flex-1 px-3 py-2 rounded-full items-center ${i <= current ? "bg-lime" : "bg-surface"}`}>
          <Text className={`text-xs font-semi ${i <= current ? "text-ink" : "text-muted"}`}>{i + 1} {s}</Text>
        </View>
      ))}
    </View>
  );
}
```

## Step 6 — Employees + CSV import

`lib/utils/csv.ts`:
```ts
import { z } from "zod";

const rowSchema = z.object({
  name: z.string().min(1),
  wallet: z.string().optional(),
  email: z.string().email().optional(),
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/),
}).refine((r) => r.wallet || r.email, "wallet or email required");

export function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/);
  const [header, ...rows] = lines;
  const cols = header.split(",").map((c) => c.trim().toLowerCase());
  const idx = (key: string) => cols.indexOf(key);

  const out: { ok: boolean; data?: any; error?: string; raw: string }[] = [];
  for (const row of rows) {
    const parts = row.split(",").map((p) => p.trim());
    const obj = {
      name: parts[idx("name")],
      wallet: idx("wallet") >= 0 ? parts[idx("wallet")] : undefined,
      email: idx("email") >= 0 ? parts[idx("email")] : undefined,
      amount: parts[idx("amount")],
    };
    const parsed = rowSchema.safeParse(obj);
    out.push(parsed.success
      ? { ok: true, data: parsed.data, raw: row }
      : { ok: false, error: parsed.error.issues[0].message, raw: row });
  }
  return out;
}
```

`app/payroll/employees.tsx`:
```tsx
import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StepIndicator } from "@/components/payroll/StepIndicator";
import { parseCsv } from "@/lib/utils/csv";
import { usePayrollStore } from "@/stores/payrollStore";
import type { EmployeeEntry } from "@/lib/api/payroll";

export default function Employees() {
  const { draft, setEmployees } = usePayrollStore();
  const [tab, setTab] = useState<"manual" | "csv">("manual");
  const [list, setList] = useState<EmployeeEntry[]>(draft.employees ?? []);

  const addRow = () => setList((l) => [...l, { id: `e_${Date.now()}_${l.length}`, name: "", amountPusd: "" }]);
  const updateRow = (i: number, patch: Partial<EmployeeEntry>) =>
    setList((l) => l.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  const removeRow = (i: number) => setList((l) => l.filter((_, idx) => idx !== i));

  const importCsv = async () => {
    const f = await DocumentPicker.getDocumentAsync({ type: "text/csv" });
    if (f.canceled) return;
    const text = await FileSystem.readAsStringAsync(f.assets[0].uri);
    const parsed = parseCsv(text);
    const ok = parsed.filter((r) => r.ok).map((r, i) => ({
      id: `e_csv_${Date.now()}_${i}`,
      name: r.data.name,
      walletAddress: r.data.wallet,
      email: r.data.email,
      amountPusd: r.data.amount,
    }));
    setList(ok);
  };

  const submit = () => {
    setEmployees(list);
    router.push("/payroll/schedule");
  };

  return (
    <ScreenContainer>
      <Header title="Employees" />
      <StepIndicator current={1} steps={["Setup", "Employees", "Schedule", "Review"]} />

      <View className="flex-row mt-4 bg-surface rounded-full p-1 self-start gap-1">
        {(["manual", "csv"] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} className={`pill ${tab === t ? "pill-active" : "pill-idle"}`}>
            <Text className={tab === t ? "text-ink" : "text-muted"}>{t === "manual" ? "Add manually" : "Import CSV"}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView className="flex-1 mt-4" contentContainerStyle={{ paddingBottom: 24 }}>
        {tab === "manual" ? (
          <View className="gap-2">
            {list.map((e, i) => (
              <Card key={e.id}>
                <Input placeholder="Name" value={e.name} onChangeText={(t) => updateRow(i, { name: t })} />
                <View className="h-2" />
                <Input placeholder="Wallet address or email" value={e.walletAddress ?? e.email ?? ""}
                  onChangeText={(t) => updateRow(i, t.includes("@") ? { email: t, walletAddress: undefined } : { walletAddress: t, email: undefined })} />
                <View className="h-2" />
                <Input placeholder="Amount PUSD" keyboardType="decimal-pad" value={e.amountPusd}
                  onChangeText={(t) => updateRow(i, { amountPusd: t })} />
                <Pressable onPress={() => removeRow(i)} className="self-end mt-2">
                  <Text className="text-danger text-xs">Remove</Text>
                </Pressable>
              </Card>
            ))}
            <Pressable onPress={addRow} className="bg-surface rounded-2xl py-4 items-center">
              <Text className="text-ink">+ Add employee</Text>
            </Pressable>
          </View>
        ) : (
          <Card>
            <Text className="text-body">CSV format: <Text className="text-muted">name, wallet OR email, amount</Text></Text>
            <Button onPress={importCsv}>Choose CSV file</Button>
            {list.length > 0 && (
              <Text className="text-muted text-xs mt-3">{list.length} rows imported successfully.</Text>
            )}
          </Card>
        )}
      </ScrollView>

      <Button disabled={list.length === 0} onPress={submit}>Continue ({list.length})</Button>
    </ScreenContainer>
  );
}
```

## Step 7 — Schedule

`app/payroll/schedule.tsx`:
```tsx
import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker"; // npx expo install @react-native-community/datetimepicker
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/payroll/StepIndicator";
import { usePayrollStore } from "@/stores/payrollStore";
import type { Frequency } from "@/lib/api/payroll";

const FREQS: Frequency[] = ["once", "weekly", "biweekly", "monthly"];

export default function Schedule() {
  const setSchedule = usePayrollStore((s) => s.setSchedule);
  const [freq, setFreq] = useState<Frequency>("once");
  const [date, setDate] = useState(new Date());

  return (
    <ScreenContainer>
      <Header title="Schedule" />
      <StepIndicator current={2} steps={["Setup", "Employees", "Schedule", "Review"]} />

      <View className="flex-row gap-2 mt-6 flex-wrap">
        {FREQS.map((f) => (
          <Pill key={f} active={freq === f} onPress={() => setFreq(f)}>{f}</Pill>
        ))}
      </View>

      <Text className="text-muted mt-6">Start date</Text>
      <DateTimePicker value={date} mode="date" onChange={(_, d) => d && setDate(d)} />

      <View className="flex-1" />
      <Button onPress={() => { setSchedule(freq, date.toISOString()); router.push("/payroll/review"); }}>
        Continue
      </Button>
    </ScreenContainer>
  );
}
```

## Step 8 — Review + execute

`hooks/useExecuteBatch.ts`:
```ts
import { useEmbeddedSolanaWallet } from "@privy-io/expo";
import { connection, solanaAdapter } from "@/lib/chains/solana";
import type { EmployeeEntry } from "@/lib/api/payroll";
import { parseAmount } from "@/lib/chains/solana";
import { useWallet } from "@/hooks/useWallet";
import { useState } from "react";
import { isValidSolanaAddress } from "@/lib/utils/validators";

export function useExecuteBatch() {
  const { address } = useWallet();
  const { wallets } = useEmbeddedSolanaWallet();
  const wallet = wallets?.[0];
  const [progress, setProgress] = useState<EmployeeEntry[]>([]);
  const [running, setRunning] = useState(false);

  const run = async (employees: EmployeeEntry[]) => {
    if (!address || !wallet) throw new Error("No wallet");
    setRunning(true);
    const result = employees.map((e) => ({ ...e, status: "queued" as const }));
    setProgress(result);
    const provider = await wallet.getProvider();

    for (let i = 0; i < result.length; i++) {
      const emp = result[i];
      try {
        if (!emp.walletAddress || !isValidSolanaAddress(emp.walletAddress)) {
          throw new Error("Invalid wallet address (email-resolution not implemented in MVP)");
        }
        const tx = await solanaAdapter.buildTransfer(address, {
          to: emp.walletAddress,
          amount: parseAmount(emp.amountPusd),
        });
        result[i] = { ...emp, status: "sent" };
        setProgress([...result]);
        const { signature } = await provider.request({
          method: "signAndSendTransaction",
          params: { transaction: tx, connection },
        });
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
        await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
        result[i] = { ...emp, status: "confirmed", signature };
        setProgress([...result]);
      } catch (e: any) {
        result[i] = { ...emp, status: "failed", error: e.message };
        setProgress([...result]);
      }
    }

    setRunning(false);
    return result;
  };

  return { run, progress, running };
}
```

`app/payroll/review.tsx`:
```tsx
import { View, Text } from "react-native";
import { router } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/payroll/StepIndicator";
import { usePayrollStore } from "@/stores/payrollStore";
import { useSaveBatch } from "@/hooks/usePayroll";

export default function Review() {
  const { draft } = usePayrollStore();
  const save = useSaveBatch();
  const employees = draft.employees ?? [];
  const total = employees.reduce((s, e) => s + parseFloat(e.amountPusd || "0"), 0);
  const networkFee = employees.length * 0.0003; // rough

  const submit = async () => {
    const auth = await LocalAuthentication.authenticateAsync({ promptMessage: "Confirm payroll" });
    if (!auth.success) return;

    await save.mutateAsync(draft as any);

    if (draft.frequency === "once") {
      router.replace({ pathname: "/payroll/status/[batchId]", params: { batchId: draft.id! } });
    } else {
      // Schedule saved server-side; client fires on next open if due
      router.replace("/(tabs)/payroll");
    }
  };

  return (
    <ScreenContainer>
      <Header title="Review" />
      <StepIndicator current={3} steps={["Setup", "Employees", "Schedule", "Review"]} />

      <Card tone="dark" className="mt-4">
        <Text className="text-inverse/60 text-xs">Total payout</Text>
        <Text className="text-display text-inverse">${total.toFixed(2)}</Text>
        <Text className="text-inverse/60 text-xs mt-1">
          {employees.length} employees · {draft.frequency} · ~${networkFee.toFixed(4)} network fee
        </Text>
      </Card>

      <View className="flex-1" />
      <Button onPress={submit} loading={save.isPending}>
        {draft.frequency === "once" ? "Sign & Execute" : "Schedule"}
      </Button>
    </ScreenContainer>
  );
}
```

## Step 9 — Execution status

`app/payroll/status/[batchId].tsx`:
```tsx
import { useEffect } from "react";
import { ScrollView, View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { CheckCircle2, Clock, XCircle } from "lucide-react-native";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { Header } from "@/components/nav/Header";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { useExecuteBatch } from "@/hooks/useExecuteBatch";
import { usePayrollStore } from "@/stores/payrollStore";

export default function Status() {
  const { batchId } = useLocalSearchParams<{ batchId: string }>();
  const { draft } = usePayrollStore();
  const { run, progress, running } = useExecuteBatch();

  useEffect(() => {
    if (draft.id === batchId && progress.length === 0) {
      run(draft.employees ?? []);
    }
  }, [batchId]);

  const completed = progress.filter((e) => e.status === "confirmed").length;
  const failed = progress.filter((e) => e.status === "failed").length;
  const pct = progress.length ? Math.round((completed / progress.length) * 100) : 0;

  return (
    <ScreenContainer>
      <Header title={draft.name ?? "Batch"} />
      <Card tone="lime" className="mt-3">
        <Text className="text-ink/70 text-xs">{running ? "Executing" : "Done"}</Text>
        <Text className="text-h1">{completed}/{progress.length}</Text>
        <View className="h-2 bg-ink/20 rounded-full mt-3 overflow-hidden">
          <View style={{ width: `${pct}%` }} className="h-full bg-ink" />
        </View>
        {failed > 0 && <Text className="text-danger text-xs mt-2">{failed} failed</Text>}
      </Card>

      <ScrollView className="mt-3" contentContainerStyle={{ gap: 8 }}>
        {progress.map((e) => {
          const Icon = e.status === "confirmed" ? CheckCircle2
                     : e.status === "failed"    ? XCircle
                     : Clock;
          const color = e.status === "confirmed" ? "#5BBF6A"
                      : e.status === "failed"    ? "#E5484D"
                      : "#7A867A";
          return (
            <Card key={e.id} className="flex-row items-center">
              <Avatar name={e.name} size={36} />
              <View className="flex-1 ml-3">
                <Text className="text-body">{e.name}</Text>
                <Text className="text-muted text-xs">${e.amountPusd} PUSD</Text>
                {e.error && <Text className="text-danger text-xs mt-0.5">{e.error}</Text>}
              </View>
              <Icon size={20} color={color} />
            </Card>
          );
        })}
      </ScrollView>
    </ScreenContainer>
  );
}
```

## Step 10 — Recurring batch trigger (client-only)

When the app opens, check if any saved recurring batch's `nextRunAt` has passed. If so, show an in-app banner: "Payroll due — tap to execute."

Implement in `app/(tabs)/_layout.tsx`:
```ts
import { useEffect } from "react";
import { useBatches } from "@/hooks/usePayroll";

// inside TabsLayout component:
const { data: batches } = useBatches();
useEffect(() => {
  const due = batches?.find((b) => b.nextRunAt && new Date(b.nextRunAt) <= new Date());
  if (due) { /* set a Zustand banner state, render inside layout */ }
}, [batches]);
```

> **Note for Palm:** This is the constraint of "client-only" execution. If recurring batches need to fire while the app is closed, we need a backend sequencer (post-MVP).

## Done when
- Create batch → execute → all employees see PUSD land
- CSV with mixed valid/invalid rows shows row-level errors before commit
- Failed employee row in execution can be retried (extend `useExecuteBatch` with a `retry(id)` helper)
- Recurring batch saved → app reminds on next open after `nextRunAt`
