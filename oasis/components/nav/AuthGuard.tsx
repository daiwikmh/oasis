"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@/lib/privy/sdk";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) router.replace("/login");
  }, [ready, authenticated, router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-ink/20 border-t-ink animate-spin" />
      </div>
    );
  }

  if (!authenticated) return null;

  return <>{children}</>;
}
