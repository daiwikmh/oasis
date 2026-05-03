import { getSpendingLimit, setSpendingLimit } from "@/lib/storage";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet) return Response.json({ error: "wallet required" }, { status: 400 });
  const limit = await getSpendingLimit(wallet);
  return Response.json({ limit: limit?.toString() ?? null });
}

export async function POST(req: NextRequest) {
  const { wallet, limitWei } = await req.json();
  if (!wallet || !limitWei) return Response.json({ error: "wallet and limitWei required" }, { status: 400 });
  const txHash = await setSpendingLimit(wallet, BigInt(limitWei));
  return Response.json({ txHash });
}
