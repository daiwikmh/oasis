import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/api/client";
import type { PayrollBatch } from "@/lib/api/payroll";

export function useBatches() {
  const api = useApi();
  return useQuery({
    queryKey: ["batches", api.userId],
    enabled:  api.enabled,
    queryFn:  () => api.call<PayrollBatch[]>("/v1/payroll/batches"),
    staleTime: 30_000,
  });
}

export function useSaveBatch() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (batch: PayrollBatch) =>
      api.call<PayrollBatch>("/v1/payroll/batches", {
        method: "POST",
        body: JSON.stringify(batch),
        idempotencyKey: batch.id,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["batches"] }),
  });
}
