import { NextResponse } from "next/server";

interface RawProduct {
  id:          string;
  name:        string;
  country?:    string;
  type?:       string;
  image?:      string;
  categories?: string[];
  range?:      { min: number; max: number; currency?: string };
  denominations?: number[];
  currency?:   string;
}

interface RawResponse {
  data:  RawProduct[];
  meta?: { _next?: string };
}

export async function GET(req: Request) {
  const apiKey = process.env.BITREFILL_API_KEY;
  const base   = process.env.BITREFILL_API_BASE ?? "https://api.bitrefill.com/v2";

  if (!apiKey) {
    return NextResponse.json({ error: "BITREFILL_API_KEY not set" }, { status: 500 });
  }

  const url     = new URL(req.url);
  const q       = url.searchParams.get("q");
  const country = url.searchParams.get("country");
  const type    = url.searchParams.get("type");
  const limit   = url.searchParams.get("limit") ?? "30";

  const upstream = new URL(base + (q ? "/products/search" : "/products"));
  if (q) upstream.searchParams.set("q", q);
  if (country) upstream.searchParams.set("country", country);
  if (type) upstream.searchParams.set("type", type);
  upstream.searchParams.set("limit", limit);

  try {
    const res = await fetch(upstream.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
      next:    { revalidate: q ? 0 : 3600 },
    });

    if (!res.ok) {
      const body = await res.text();
      return NextResponse.json(
        { error: `upstream ${res.status}`, detail: body.slice(0, 500) },
        { status: 502 },
      );
    }

    const data = (await res.json()) as RawResponse;
    return NextResponse.json(data, {
      headers: {
        "x-quota-remaining": res.headers.get("X-product-quota-remaining") ?? "",
        "x-quota-next":      res.headers.get("X-product-quota-next-window") ?? "",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
