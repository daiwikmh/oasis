"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, BarChart3, ArrowLeftRight, Users, User, ShieldCheck, ShoppingBag } from "lucide-react";
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

export function TopBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="md:hidden sticky top-0 z-40 bg-canvas border-b border-hairline">
      <div className="flex items-center justify-between px-4 h-14">
        <Link href="/dashboard" className="text-xl font-bold text-ink">Oasis</Link>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          className="p-2 -mr-2 text-ink"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <nav className="px-2 pb-3 flex flex-col gap-1 bg-canvas">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium",
                  active ? "bg-lime text-ink" : "text-muted hover:bg-canvas-alt hover:text-ink",
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
