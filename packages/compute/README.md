# @daiwikdomain/parellax-compute

0G Compute TEE wrapper for agentic banking — evaluates financial transaction intents using an LLM running inside a Trusted Execution Environment. Every decision comes with a cryptographic verification ID and a `teeVerified` flag confirming the inference ran inside a sealed enclave.

## Install

```bash
npm install @daiwikdomain/parellax-compute
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `OG_COMPUTE_KEY` | Yes | API key for the 0G Compute router |

Get a key from the 0G Compute portal.

## Usage

```ts
import { evaluateTransaction } from '@daiwikdomain/parellax-compute'
import { parseEther } from 'viem'

const decision = await evaluateTransaction(
  'pay the nanny 0.1 OG',
  {
    walletAddr: '0xUserWallet',
    amountWei: parseEther('0.1'),
    recipient: '0xRecipientAddress',
    spendingLimitWei: parseEther('1.0'),
    currentBalanceWei: parseEther('0.3'),
  }
)

console.log(decision.approved)        // true | false
console.log(decision.reason)          // 'Transaction within limit and balance'
console.log(decision.verificationId)  // 'chatcmpl-abc123' — TEE inference ID
console.log(decision.teeVerified)     // true — confirmed sealed enclave execution
console.log(decision.model)           // model name used
```

## Types

```ts
interface TransactionContext {
  walletAddr: string        // user wallet address
  amountWei: bigint         // amount to transfer in wei
  recipient: string         // recipient address
  spendingLimitWei: bigint  // user's current spending limit in wei
  currentBalanceWei: bigint // available balance in wei
}

interface ApprovalDecision {
  approved: boolean         // whether the TEE approved the transaction
  reason: string            // short explanation from the model
  model: string             // model ID used for inference
  verificationId: string    // unique ID for this TEE inference run
  teeVerified: boolean      // true if inference ran inside a sealed enclave
}
```

## What the TEE does

The model receives the intent, amount, recipient, spending limit, and balance — all in human-readable OG amounts. It returns a structured JSON decision. The inference runs with `verify_tee: true`, which triggers on-chain signature verification by the provider. The `teeVerified` flag in the response confirms the computation happened inside a sealed enclave that the host cannot inspect or tamper with.

The `verificationId` is the receipt. Use it as the authorization proof when calling your on-chain vault.

## Network

| Constant | Value |
|---|---|
| Compute router | `https://router-api-testnet.integratenetwork.work/v1` |
| Model | `qwen/qwen-2.5-7b-instruct` |
