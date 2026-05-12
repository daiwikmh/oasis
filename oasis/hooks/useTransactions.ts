import { useQuery } from "@tanstack/react-query";
import { useEmbeddedSolanaWallet } from "@/lib/privy/sdk";
import { solanaAdapter } from "@/lib/chains/solana";
import type { TokenTransfer } from "@/lib/chains/types";

export function useTransactions(limit = 50) {
  const { wallets } = useEmbeddedSolanaWallet();
  const address = wallets?.[0]?.address;

  return useQuery<TokenTransfer[]>({
    queryKey: ["pusd-txs", address, limit],
    queryFn: () => solanaAdapter.getTransactions(address!, limit),
    enabled: !!address,
    staleTime: 30_000,
  });
}
