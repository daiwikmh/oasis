import { useQuery } from "@tanstack/react-query";
import { useEmbeddedSolanaWallet } from "@/lib/privy/sdk";
import { solanaAdapter } from "@/lib/chains/solana";
import type { TokenBalance } from "@/lib/chains/types";

export function usePusdBalance() {
  const { wallets } = useEmbeddedSolanaWallet();
  const address = wallets?.[0]?.address;

  return useQuery<TokenBalance>({
    queryKey: ["pusd-balance", address],
    queryFn: () => solanaAdapter.getBalance(address!),
    enabled: !!address,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  });
}
