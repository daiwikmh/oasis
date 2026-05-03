# @daiwikdomain/parellax-compute

0G Compute TEE wrapper — evaluates financial intents using an LLM inside a Trusted Execution Environment. Returns a structured decision with a cryptographic verification ID and a `teeVerified` flag.

```bash
npm install @daiwikdomain/parellax-compute
```

## Flow

```
your app
   │
   └── evaluateTransaction(intent, ctx)
          │
          ├── sends to 0G Compute router (verify_tee: true)
          ├── model runs inside sealed TEE enclave
          ├── returns JSON decision + verification ID
          │
          └── ApprovalDecision
                ├── approved: boolean
                ├── reason: string
                ├── verificationId: string  ← TEE receipt, use as vault nonce
                └── teeVerified: boolean    ← enclave confirmed
```

## Env vars

| Variable | Required |
|---|---|
| `OG_COMPUTE_KEY` | Yes — API key from 0G Compute portal |

## Usage

```ts
import { evaluateTransaction } from '@daiwikdomain/parellax-compute'
import { parseEther } from 'viem'

const decision = await evaluateTransaction('pay the nanny 0.1 OG', {
  walletAddr: '0xUserWallet',
  amountWei: parseEther('0.1'),
  recipient: '0xRecipient',
  spendingLimitWei: parseEther('1.0'),
  currentBalanceWei: parseEther('0.3'),
})

decision.approved        // true
decision.verificationId  // 'chatcmpl-...' — pass this to your vault contract
decision.teeVerified     // true — sealed enclave confirmed
```

## Types

```ts
interface TransactionContext {
  walletAddr: string
  amountWei: bigint
  recipient: string
  spendingLimitWei: bigint
  currentBalanceWei: bigint
}

interface ApprovalDecision {
  approved: boolean
  reason: string
  model: string
  verificationId: string  // unique TEE inference ID
  teeVerified: boolean    // confirmed sealed enclave execution
}
```

## Network

| | |
|---|---|
| Router | `router-api-testnet.integratenetwork.work/v1` |
| Model | `qwen/qwen-2.5-7b-instruct` |
| TEE | `verify_tee: true` on every request |
