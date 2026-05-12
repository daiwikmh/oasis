import { useQuery } from "@tanstack/react-query";
import { PublicKey } from "@solana/web3.js";
import { useEmbeddedSolanaWallet } from "@/lib/privy/sdk";
import { getConnection } from "@/lib/chains/solana";

const LAMPORTS_PER_SOL = 1_000_000_000;

export interface SolBalance {
  lamports: number;
  sol:      number;
}

export function useSolBalance() {
  const { wallets } = useEmbeddedSolanaWallet();
  const address = wallets?.[0]?.address;

  return useQuery<SolBalance>({
    queryKey: ["sol-balance", address],
    enabled:  !!address,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    queryFn:  async () => {
      const lamports = await getConnection().getBalance(new PublicKey(address!));
      return { lamports, sol: lamports / LAMPORTS_PER_SOL };
    },
  });
}
