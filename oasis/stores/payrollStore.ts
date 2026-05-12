import { create } from "zustand";
import type { EmployeeEntry, Frequency, PayrollBatch } from "@/lib/api/payroll";

interface PayrollState {
  draft: Partial<PayrollBatch> & { employees: EmployeeEntry[] };
  setDraftName: (name: string) => void;
  setDraftFrequency: (freq: Frequency) => void;
  addEmployee: (emp: EmployeeEntry) => void;
  removeEmployee: (id: string) => void;
  updateEmployee: (id: string, update: Partial<EmployeeEntry>) => void;
  resetDraft: () => void;
}

const emptyDraft = { employees: [] as EmployeeEntry[], name: "", frequency: "once" as Frequency };

export const usePayrollStore = create<PayrollState>((set) => ({
  draft: { ...emptyDraft },
  setDraftName: (name) => set((s) => ({ draft: { ...s.draft, name } })),
  setDraftFrequency: (frequency) => set((s) => ({ draft: { ...s.draft, frequency } })),
  addEmployee: (emp) => set((s) => ({ draft: { ...s.draft, employees: [...s.draft.employees, emp] } })),
  removeEmployee: (id) => set((s) => ({ draft: { ...s.draft, employees: s.draft.employees.filter((e) => e.id !== id) } })),
  updateEmployee: (id, update) => set((s) => ({
    draft: { ...s.draft, employees: s.draft.employees.map((e) => e.id === id ? { ...e, ...update } : e) },
  })),
  resetDraft: () => set({ draft: { ...emptyDraft } }),
}));
