import { getSpendingLimit, appendAuditLog } from "@/lib/storage";
import { evaluateTransaction } from "@/lib/compute";
import { createWalletClient, createPublicClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { NextRequest } from "next/server";

const OG_CHAIN = {
  id: 16602,
  name: "0G Galileo",
  network: "galileo",
  nativeCurrency: { name: "OG", symbol: "OG", decimals: 18 },
  rpcUrls: { default: { http: ["https://evmrpc-testnet.0g.ai"] } },
} as const;

const enc = new TextEncoder();

function send(controller: ReadableStreamDefaultController, msg: string) {
  controller.enqueue(enc.encode(`data: ${JSON.stringify({ msg })}\n\n`));
}

export async function POST(req: NextRequest) {
  const { intent, amountEth, recipient, walletAddr } = await req.json();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const amountWei = parseEther(String(amountEth));

        send(controller, "Checking 0G KV for spending limit...");
        const limit = await getSpendingLimit(walletAddr).catch(() => null);
        const limitWei = limit ?? parseEther("1.0");
        if (amountWei > limitWei) {
          send(controller, `REJECTED: Amount ${amountEth} OG exceeds limit ${Number(limitWei) / 1e18} OG`);
          controller.close();
          return;
        }
        send(controller, `Limit OK — ${Number(limitWei) / 1e18} OG available`);

        send(controller, "Consulting 0G Compute (TEE)...");
        const pk = process.env.PRIVATE_KEY as `0x${string}`;
        if (!pk) throw new Error("PRIVATE_KEY not set");
        const account = privateKeyToAccount(pk);
        const publicClient = createPublicClient({ chain: OG_CHAIN, transport: http() });
        const balance = await publicClient.getBalance({ address: account.address });

        const decision = await evaluateTransaction(intent, {
          walletAddr,
          amountWei,
          recipient,
          spendingLimitWei: limitWei,
          currentBalanceWei: balance,
        });

        send(controller, `Decision: ${decision.approved ? "APPROVED" : "REJECTED"} — ${decision.reason}`);
        send(controller, `Verification ID: ${decision.verificationId}`);
        send(controller, `TEE Verified: ${decision.teeVerified ? "yes" : "no"}`);

        if (!decision.approved) {
          appendAuditLog(walletAddr, {
            ts: Date.now(), intent, decision: "rejected",
            verificationId: decision.verificationId,
          }).catch(() => null);
          controller.close();
          return;
        }

        send(controller, "Settling on 0G Chain...");
        const vaultAddr = process.env.VAULT_ADDRESS as `0x${string}`;
        if (!vaultAddr) throw new Error("VAULT_ADDRESS not set");

        const walletClient = createWalletClient({ account, chain: OG_CHAIN, transport: http() });

        // Sign keccak256(abi.encodePacked(to, amount, verificationId)) — matches contract verification
        const { keccak256, encodePacked, toHex } = await import("viem");
        const hash = keccak256(
          encodePacked(
            ["address", "uint256", "string"],
            [recipient as `0x${string}`, amountWei, decision.verificationId]
          )
        );
        const sig = await account.signMessage({ message: { raw: hash } });

        const VAULT_ABI = [
          { name: "release", type: "function", stateMutability: "nonpayable",
            inputs: [
              { name: "to", type: "address" },
              { name: "amount", type: "uint256" },
              { name: "verificationId", type: "string" },
              { name: "signature", type: "bytes" },
            ], outputs: [] }
        ] as const;

        const txHash = await walletClient.writeContract({
          address: vaultAddr,
          abi: VAULT_ABI,
          functionName: "release",
          args: [recipient as `0x${string}`, amountWei, decision.verificationId, sig],
        });

        send(controller, `Tx submitted: ${txHash}`);

        const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
        send(controller, `Confirmed in block ${receipt.blockNumber}`);

        appendAuditLog(walletAddr, {
          ts: Date.now(), intent, decision: "approved",
          verificationId: decision.verificationId,
          txHash,
        }).catch(() => null);

        send(controller, `Done. ${amountEth} OG released to ${recipient}`);
      } catch (e) {
        send(controller, `ERROR: ${(e as Error).message}`);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
