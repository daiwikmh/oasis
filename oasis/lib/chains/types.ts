export interface TokenBalance {
  raw: bigint;
  formatted: string;
}

export interface TokenTransfer {
  hash: string;
  from: string;
  to: string;
  amount: bigint;
  timestamp: number;
  direction: "in" | "out";
  memo?: string;
}

export interface TransferParams {
  to: string;
  amount: bigint;
  memo?: string;
}

export interface ChainAdapter {
  getBalance(walletAddress: string): Promise<TokenBalance>;
  getTransactions(walletAddress: string, limit?: number): Promise<TokenTransfer[]>;
}
