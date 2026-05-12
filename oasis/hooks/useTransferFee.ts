import { useQuery } from "@tanstack/react-query";
import { estimateTransferFee } from "@/lib/chains/solana";
import { isValidSolanaAddress } from "@/lib/utils/validators";

export function useTransferFee(toAddress: string | undefined) {
  return useQuery({
    queryKey: ["transfer-fee", toAddress],
    enabled:  Boolean(toAddress && isValidSolanaAddress(toAddress)),
    queryFn:  () => estimateTransferFee(toAddress!),
    staleTime: 60_000,
  });
}
