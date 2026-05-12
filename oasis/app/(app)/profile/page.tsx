"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check, LogOut, KeyRound, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, initialsFor } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { usePrivy, useEmbeddedSolanaWallet, useLogout } from "@/lib/privy/sdk";
import { usePusdBalance } from "@/hooks/usePusdBalance";
import { useSolBalance } from "@/hooks/useSolBalance";
import { shortenAddress } from "@/lib/utils/validators";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = usePrivy();
  const { logout } = useLogout();
  const { wallets, exportWallet } = useEmbeddedSolanaWallet();
  const pusd = usePusdBalance();
  const sol = useSolBalance();
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const address = wallets?.[0]?.address;
  const linkedEmail = user?.linkedAccounts?.find((a) => a.type === "email");
  const email =
    user?.email?.address ??
    (linkedEmail && "address" in linkedEmail ? linkedEmail.address : undefined) ??
    "";

  async function copy() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function onExport() {
    if (!address) return;
    setExporting(true);
    setExportError(null);
    try {
      await exportWallet({ address });
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  async function onLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <div className="flex flex-col items-center gap-3">
        <Avatar className="w-24 h-24">
          <AvatarFallback className="text-2xl">{initialsFor(email || "U")}</AvatarFallback>
        </Avatar>
        <p className="text-lg font-semibold text-ink">{email || "Signed in"}</p>
      </div>

      {address && (
        <Card className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-xs text-muted">Wallet address</p>
            <p className="text-sm text-ink font-mono truncate">{shortenAddress(address, 8)}</p>
          </div>
          <button
            onClick={copy}
            aria-label="Copy address"
            className="text-muted hover:text-ink p-2 shrink-0"
          >
            {copied ? <Check size={18} className="text-success" /> : <Copy size={18} />}
          </button>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs text-muted">PUSD</p>
          <p className="text-xl font-bold text-ink mt-1">${pusd.data?.formatted ?? "—"}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted">SOL (gas)</p>
          <p className="text-xl font-bold text-ink mt-1">
            {sol.data ? sol.data.sol.toFixed(4) : "—"}
          </p>
        </Card>
      </div>

      <Card>
        <div className="flex items-start gap-3">
          <span className="w-10 h-10 rounded-2xl bg-canvas-alt flex items-center justify-center shrink-0">
            <KeyRound size={18} className="text-ink" />
          </span>
          <div className="flex-1">
            <p className="font-semibold text-ink text-sm">Export private key</p>
            <p className="text-xs text-muted mt-0.5">
              Move your wallet to Phantom or Backpack. Keep your key offline.
            </p>
            {exportError && (
              <p className="text-danger text-xs mt-2">{exportError}</p>
            )}
            <Button
              variant="ghost"
              size="md"
              className="mt-3"
              onClick={onExport}
              disabled={!address || exporting}
            >
              {exporting ? "Opening..." : "Export key"}
            </Button>
          </div>
        </div>
      </Card>

      <Link href="/reserves">
        <Card className="flex items-center gap-3 hover:bg-canvas-alt transition-colors">
          <span className="w-10 h-10 rounded-2xl bg-canvas-alt flex items-center justify-center">
            <ShieldCheck size={18} className="text-ink" />
          </span>
          <span className="flex-1 text-sm text-ink">PUSD transparency</span>
          <span className="text-muted">›</span>
        </Card>
      </Link>

      <button
        onClick={onLogout}
        className="w-full flex items-center justify-center gap-2 py-4 text-danger font-semibold"
      >
        <LogOut size={18} />
        Sign out
      </button>
    </main>
  );
}
