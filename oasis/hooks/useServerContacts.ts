import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/lib/api/client";
import type { ServerContact, ContactInput } from "@/lib/api/contacts";

export function useServerContacts() {
  const api = useApi();
  return useQuery({
    queryKey: ["contacts", api.userId],
    enabled:  api.enabled,
    queryFn:  () => api.call<ServerContact[]>("/v1/contacts"),
    staleTime: 30_000,
  });
}

export function useAddContact() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ContactInput) =>
      api.call<ServerContact>("/v1/contacts", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts"] }),
  });
}
