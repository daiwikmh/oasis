"use client";

import { useEmbeddedSolanaWallet, usePrivy } from "@/lib/privy/sdk";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { token: string; idempotencyKey?: string },
): Promise<T> {
  if (!API_URL) throw new ApiError(0, "API_URL not configured");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization:  `Bearer ${init.token}`,
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.idempotencyKey) headers["Idempotency-Key"] = init.idempotencyKey;

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new ApiError(res.status, body || `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function useApi() {
  const { getAccessToken, user } = usePrivy();
  const { wallets } = useEmbeddedSolanaWallet();
  return {
    walletAddress: wallets?.[0]?.address,
    userId:        user?.id,
    enabled:       Boolean(user && API_URL),
    async call<T>(
      path: string,
      init: Omit<RequestInit, "headers"> & { idempotencyKey?: string } = {},
    ): Promise<T> {
      const token = await getAccessToken();
      if (!token) throw new ApiError(401, "no access token");
      return apiFetch<T>(path, { ...init, token });
    },
  };
}
