import { NextResponse } from "next/server";

export const revalidate = 300;

interface RawChain {
  chain:       string;
  circulating: number;
}

interface RawSnapshot {
  as_of:             string;
  chains:            RawChain[];
  snapshot_id:       string;
  total_circulating: number;
}

interface RawResponse {
  count: number;
  data:  RawSnapshot[];
}

export async function GET() {
  try {
    const res = await fetch("https://www.palmusd.com/api/v1/circulation/history", {
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: `upstream ${res.status}` }, { status: 502 });
    }
    const raw = (await res.json()) as RawResponse;
    const points = raw.data.map((snap) => {
      const byChain: Record<string, number> = {};
      for (const c of snap.chains) byChain[c.chain.toLowerCase()] = c.circulating;
      return {
        date:    snap.as_of,
        total:   snap.total_circulating,
        byChain,
      };
    });
    return NextResponse.json({ points });
  } catch (e) {
    const message = e instanceof Error ? e.message : "fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
