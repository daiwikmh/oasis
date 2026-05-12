"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Share2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useEmbeddedSolanaWallet } from "@/lib/privy/sdk";
import { shortenAddress } from "@/lib/utils/validators";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiveDialog({ open, onOpenChange }: Props) {
  const { wallets } = useEmbeddedSolanaWallet();
  const address = wallets?.[0]?.address;
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function share() {
    if (!address) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "My PUSD address", text: address });
        return;
      } catch {
        // user dismissed
      }
    }
    copy();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Receive PUSD</DialogTitle>
          <DialogDescription>Solana network only.</DialogDescription>
        </DialogHeader>

        {address ? (
          <div className="flex flex-col items-center gap-4">
            <Card tone="white" className="p-4">
              <QRCodeSVG value={address} size={200} bgColor="#FFFFFF" fgColor="#0E1410" />
            </Card>
            <Card className="w-full flex items-center justify-between">
              <span className="text-sm font-mono text-ink">{shortenAddress(address, 8)}</span>
              <button onClick={copy} className="text-muted hover:text-ink p-1" aria-label="Copy address">
                {copied ? <Check size={18} className="text-success" /> : <Copy size={18} />}
              </button>
            </Card>
            <p className="text-xs text-muted text-center">
              Sending non-PUSD tokens to this address may result in loss.
            </p>
            <Button variant="dark" onClick={share} className="w-full">
              <Share2 size={16} />
              Share address
            </Button>
          </div>
        ) : (
          <p className="text-muted text-sm text-center py-8">No wallet connected.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
