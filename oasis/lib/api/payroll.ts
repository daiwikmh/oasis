export interface EmployeeEntry {
  id: string;
  name: string;
  walletAddress?: string;
  email?: string;
  amountPusd: string;
  status?: "pending" | "queued" | "sent" | "confirmed" | "failed";
  signature?: string;
  error?: string;
}

export type Frequency = "once" | "weekly" | "biweekly" | "monthly";

export interface PayrollBatch {
  id: string;
  name: string;
  frequency: Frequency;
  nextRunAt?: string;
  endAfterRuns?: number;
  runsCompleted: number;
  employees: EmployeeEntry[];
  createdAt: string;
}

export function parsePayrollCsv(csv: string): EmployeeEntry[] {
  const lines = csv.trim().split("\n").slice(1);
  return lines.map((line, i) => {
    const [name = "", walletAddress = "", amountPusd = "0"] = line.split(",").map((s) => s.trim());
    return {
      id: `csv-${i}`,
      name,
      walletAddress: walletAddress || undefined,
      amountPusd,
      status: "pending",
    };
  });
}
