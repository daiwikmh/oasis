"use client";

import { useState } from "react";
import { useEmbeddedSolanaWallet } from "@/lib/privy/sdk";
import { buildTransferTx, getConnection } from "@/lib/chains/solana";
import { isValidSolanaAddress } from "@/lib/utils/validators";
import { parsePusd } from "@/lib/tokens/pusd";
import type { EmployeeEntry } from "@/lib/api/payroll";

export function useExecuteBatch() {
  const { wallets } = useEmbeddedSolanaWallet();
  const [progress, setProgress] = useState<EmployeeEntry[]>([]);
  const [running, setRunning] = useState(false);

  async function run(employees: EmployeeEntry[]) {
    const wallet = wallets?.[0];
    if (!wallet) throw new Error("No wallet connected");

    const result: EmployeeEntry[] = employees.map((e) => ({ ...e, status: "queued" }));
    setRunning(true);
    setProgress(result);
    const connection = getConnection();

    for (let i = 0; i < result.length; i++) {
      const emp = result[i];
      try {
        if (!emp.walletAddress || !isValidSolanaAddress(emp.walletAddress)) {
          throw new Error("Invalid wallet address (email resolution not implemented)");
        }
        const tx = await buildTransferTx(
          { to: emp.walletAddress, amount: parsePusd(emp.amountPusd) },
          wallet.address,
        );
        result[i] = { ...emp, status: "sent" };
        setProgress([...result]);
        const signed = await wallet.signTransaction(tx);
        const signature = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(signature, "confirmed");
        result[i] = { ...emp, status: "confirmed", signature };
        setProgress([...result]);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed";
        result[i] = { ...emp, status: "failed", error: message };
        setProgress([...result]);
      }
    }

    setRunning(false);
    return result;
  }

  function reset() {
    setProgress([]);
    setRunning(false);
  }

  return { run, progress, running, reset };
}
