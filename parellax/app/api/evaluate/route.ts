import { evaluateTransaction } from "@/lib/compute";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { intent, context } = await req.json();
  const decision = await evaluateTransaction(intent, context);
  return Response.json(decision);
}
