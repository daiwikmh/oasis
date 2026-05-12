"use client";

import { useQuery } from "@tanstack/react-query";

export interface BitrefillProduct {
  id:             string;
  name:           string;
  country?:       string;
  type?:          string;
  image?:         string;
  categories?:    string[];
  range?:         { min: number; max: number; currency?: string };
  denominations?: number[];
  currency?:      string;
}

interface ProductsResponse {
  data:  BitrefillProduct[];
  meta?: { _next?: string };
}

interface Params {
  q?:       string;
  country?: string;
  type?:    string;
  limit?:   number;
}

export function useBitrefillProducts(params: Params) {
  return useQuery<ProductsResponse>({
    queryKey: ["bitrefill", "products", params],
    queryFn:  async () => {
      const url = new URL("/api/bitrefill/products", window.location.origin);
      if (params.q)       url.searchParams.set("q", params.q);
      if (params.country) url.searchParams.set("country", params.country);
      if (params.type)    url.searchParams.set("type", params.type);
      if (params.limit)   url.searchParams.set("limit", String(params.limit));

      const res = await fetch(url.toString());
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`bitrefill ${res.status}: ${body.slice(0, 200)}`);
      }
      return res.json() as Promise<ProductsResponse>;
    },
    staleTime: params.q ? 0 : 60 * 60 * 1000,
  });
}
