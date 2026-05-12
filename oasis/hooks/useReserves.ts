import { useQuery } from "@tanstack/react-query";
import { fetchCirculation, fetchCirculationHistory } from "@/lib/palm/public";

export function useReserves() {
  return useQuery({
    queryKey: ["palm-transparency"],
    queryFn:  () =>
      Promise.all([fetchCirculation(), fetchCirculationHistory()]).then(
        ([circulation, history]) => ({ circulation, history }),
      ),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}
