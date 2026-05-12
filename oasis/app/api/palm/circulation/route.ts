import { NextResponse } from "next/server";

export const revalidate = 60;

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
    const res = await fetch("https://www.palmusd.com/api/v1/circulation", {
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: `upstream ${res.status}` }, { status: 502 });
    }
    const raw = (await res.json()) as RawResponse;
    const snap = raw.data?.[0];
    if (!snap) return NextResponse.json({ error: "empty" }, { status: 502 });

    const byChain: Record<string, number> = {};
    for (const c of snap.chains) byChain[c.chain.toLowerCase()] = c.circulating;

    return NextResponse.json({
      total:     snap.total_circulating,
      byChain,
      updatedAt: snap.as_of,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
