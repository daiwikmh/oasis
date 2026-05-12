"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, ArrowLeftRight, Users, User, ShieldCheck, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Home",   Icon: Home },
  { href: "/stats",    label: "Stats",        Icon: BarChart3 },
  { href: "/swap",     label: "Swap",         Icon: ArrowLeftRight },
  { href: "/payroll",  label: "Payroll",      Icon: Users },
  { href: "/commerce", label: "Commerce",     Icon: ShoppingBag },
  { href: "/profile",  label: "Profile",      Icon: User },
  { href: "/reserves", label: "Transparency", Icon: ShieldCheck },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col md:w-60 md:fixed md:inset-y-0 bg-surface border-r border-hairline px-4 py-6">
      <Link href="/dashboard" className="text-2xl font-bold text-ink mb-8 px-2">
        Oasis
      </Link>
      <nav className="flex flex-col gap-1">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-colors",
                active ? "bg-lime text-ink" : "text-muted hover:bg-canvas-alt hover:text-ink",
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
