const PALM_PUBLIC_BASE = "https://www.palmusd.com/api/v1";

export interface PalmCirculation {
  total:     string;
  byChain:   Record<string, string>;
  updatedAt: string;
}

export interface PalmReserves {
  totalUsd:    string;
  attestation: { url: string; date: string } | null;
  breakdown:   Array<{ asset: string; amountUsd: string }>;
  updatedAt:   string;
}

export async function fetchCirculation(): Promise<unknown> {
  const res = await fetch(`${PALM_PUBLIC_BASE}/circulation`);
  if (!res.ok) throw new Error(`Palm circulation ${res.status}`);
  return res.json();
}

export async function fetchReserves(): Promise<unknown> {
  const res = await fetch(`${PALM_PUBLIC_BASE}/reserves`);
  if (!res.ok) throw new Error(`Palm reserves ${res.status}`);
  return res.json();
}
