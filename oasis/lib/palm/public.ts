export interface PalmCirculation {
  total:     number;
  byChain:   Record<string, number>;
  updatedAt: string;
  error?:    string;
}

export interface PalmCirculationPoint {
  date:    string;
  total:   number;
  byChain: Record<string, number>;
}

export interface PalmCirculationHistory {
  points: PalmCirculationPoint[];
  error?: string;
}

export async function fetchCirculation(): Promise<PalmCirculation> {
  const res = await fetch("/api/palm/circulation");
  if (!res.ok) throw new Error(`circulation ${res.status}`);
  return res.json();
}

export async function fetchCirculationHistory(): Promise<PalmCirculationHistory> {
  const res = await fetch("/api/palm/circulation/history");
  if (!res.ok) throw new Error(`circulation history ${res.status}`);
  return res.json();
}
