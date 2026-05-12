"use client";

import { useState } from "react";
import { Check, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { usePusdBalance } from "@/hooks/usePusdBalance";
import { useSolBalance } from "@/hooks/useSolBalance";
import { useTransfer } from "@/hooks/useTransfer";
import { useTransferFee } from "@/hooks/useTransferFee";
import { isValidSolanaAddress, shortenAddress } from "@/lib/utils/validators";
import { parsePusd, formatPusd } from "@/lib/tokens/pusd";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "recipient" | "amount" | "confirm" | "success";

export function SendDialog({ open, onOpenChange }: Props) {
  const [step, setStep] = useState<Step>("recipient");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const balance = usePusdBalance();
  const sol = useSolBalance();
  const fee = useTransferFee(step === "confirm" ? recipient : undefined);
  const transfer = useTransfer();

  function reset() {
    setStep("recipient");
    setRecipient("");
    setAmount("");
    transfer.reset();
  }

  function handleClose(value: boolean) {
    if (!value) reset();
    onOpenChange(value);
  }

  const recipientValid = isValidSolanaAddress(recipient);
  const amountRaw = amount ? parsePusd(amount) : 0n;
  const balanceRaw = balance.data?.raw ?? 0n;
  const insufficient = amountRaw > balanceRaw;
  const amountValid = amountRaw > 0n && !insufficient;
  const lowSol = Boolean(
    fee.data && sol.data !== undefined && sol.data.lamports < fee.data.totalLamports,
  );

  async function submit() {
    try {
      await transfer.transfer({ to: recipient, amount: amountRaw });
      setStep("success");
    } catch {
      // error displayed inline
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {step === "recipient" && "Send PUSD"}
            {step === "amount" && "Amount"}
            {step === "confirm" && "Review"}
            {step === "success" && "Sent"}
          </DialogTitle>
          {step !== "success" && (
            <DialogDescription>
              {step === "recipient" && "Paste a Solana address."}
              {step === "amount" && `To ${shortenAddress(recipient, 6)}`}
              {step === "confirm" && "Network fees are paid in SOL."}
            </DialogDescription>
          )}
        </DialogHeader>

        {step === "recipient" && (
          <div className="space-y-4">
            <Input
              placeholder="Solana address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value.trim())}
              error={recipient && !recipientValid ? "Invalid Solana address" : undefined}
              autoFocus
            />
            <Button
              className="w-full"
              disabled={!recipientValid}
              onClick={() => setStep("amount")}
            >
              Continue
            </Button>
          </div>
        )}

        {step === "amount" && (
          <div className="space-y-4">
            <div className="text-center bg-surface rounded-2xl py-6 px-4">
              <p className="text-xs text-muted">PUSD</p>
              <div className="flex items-baseline justify-center mt-2">
                <span className="text-4xl font-bold text-ink">$</span>
                <input
                  inputMode="decimal"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                  className="bg-transparent outline-none text-4xl font-bold text-ink text-center max-w-[60%] placeholder:text-muted"
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted mt-2">
                Available: ${balance.data?.formatted ?? "—"}
              </p>
              <button
                onClick={() => setAmount(formatPusd(balanceRaw).replace(",", ""))}
                className="bg-lime text-ink rounded-full text-xs px-3 py-1 mt-3 font-semibold hover:bg-lime-strong"
              >
                Max
              </button>
            </div>
            {insufficient && (
              <p className="text-danger text-xs text-center">Insufficient balance</p>
            )}
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setStep("recipient")}>
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={!amountValid}
                onClick={() => setStep("confirm")}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            <Card>
              <Row label="Amount" value={`$${amount} PUSD`} bold />
              <Row label="To" value={shortenAddress(recipient, 6)} />
              <div className="border-t border-hairline my-2" />
              <Row label="Network" value="Solana" />
              <Row
                label="Fee"
                value={
                  fee.isLoading
                    ? "—"
                    : fee.data
                    ? `~${fee.data.totalSol.toFixed(6)} SOL${fee.data.needsAtaCreation ? " (incl. account creation)" : ""}`
                    : "—"
                }
              />
            </Card>
            {lowSol && (
              <p className="text-danger text-xs text-center">
                Not enough SOL for network fees. You have {sol.data?.sol.toFixed(6) ?? "0"} SOL,
                need ~{fee.data ? fee.data.totalSol.toFixed(6) : "—"} SOL.
              </p>
            )}
            {transfer.error && (
              <p className="text-danger text-xs text-center">{transfer.error}</p>
            )}
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => setStep("amount")}>
                Back
              </Button>
              <Button
                className="flex-1"
                disabled={transfer.status === "pending" || lowSol}
                onClick={submit}
              >
                {transfer.status === "pending" ? "Signing..." : "Sign & Send"}
              </Button>
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-lime rounded-full w-20 h-20 flex items-center justify-center">
              <Check size={40} className="text-ink" strokeWidth={3} />
            </div>
            <p className="text-2xl font-bold text-ink">${amount} sent</p>
            {transfer.signature && (
              <a
                href={`https://solscan.io/tx/${transfer.signature}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-cyan font-medium hover:underline"
              >
                View on Solscan
                <ExternalLink size={14} />
              </a>
            )}
            <Button className="w-full" onClick={() => handleClose(false)}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-muted text-sm">{label}</span>
      <span className={`text-ink text-sm ${bold ? "font-bold" : ""}`}>{value}</span>
    </div>
  );
}
