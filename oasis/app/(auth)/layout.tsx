"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePrivy } from "@/lib/privy/sdk";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready || !authenticated) return;
    if (pathname?.startsWith("/onboarding")) return;
    router.replace("/dashboard");
  }, [ready, authenticated, pathname, router]);

  return <main className="min-h-screen flex items-center justify-center px-4">{children}</main>;
}
