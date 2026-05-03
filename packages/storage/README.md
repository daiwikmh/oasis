# @daiwikdomain/parellax-storage

0G KV Storage wrapper for agentic banking — user spending limits and append-only audit logs stored on the 0G decentralized network.

Data is stored under a shared KV stream keyed by wallet address. Neither the application nor any operator can edit or delete entries after they are written.

## Install

```bash
npm install @daiwikdomain/parellax-storage
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `PRIVATE_KEY` | Yes | Wallet private key — signs KV write transactions |
| `OG_KV_NODE_URL` | No | 0G KV node URL (defaults to `http://3.101.147.150:6789`) |

## Usage

### Spending limits

```ts
import { setSpendingLimit, getSpendingLimit } from '@daiwikdomain/parellax-storage'
import { parseEther } from 'ethers'

// Write — sets spending limit for a wallet (stored on 0G KV)
const txHash = await setSpendingLimit(
  '0xYourWalletAddress',
  parseEther('1.0') // limit in wei
)

// Read — returns limit in wei, or null if not set
const limit = await getSpendingLimit('0xYourWalletAddress')
if (limit !== null) {
  console.log('Limit:', Number(limit) / 1e18, 'OG')
}
```

### Audit log

```ts
import { appendAuditLog, getAuditLog } from '@daiwikdomain/parellax-storage'

// Append an entry (approved or rejected)
await appendAuditLog('0xYourWalletAddress', {
  ts: Date.now(),
  intent: 'pay the nanny 200 OG',
  decision: 'approved',
  verificationId: 'chatcmpl-abc123',
  txHash: '0xdeadbeef...',   // optional, include on approval
})

// Read full log for a wallet
const log = await getAuditLog('0xYourWalletAddress')
log.forEach(entry => {
  console.log(entry.ts, entry.decision, entry.intent)
})
```

## Types

```ts
interface AuditEntry {
  ts: number               // Unix ms timestamp
  intent: string           // Original natural-language intent
  decision: 'approved' | 'rejected'
  verificationId: string   // TEE inference ID
  txHash?: string          // On-chain tx hash (approvals only)
}
```

## Network

Targets the 0G Galileo testnet.

| Constant | Value |
|---|---|
| EVM RPC | `https://evmrpc-testnet.0g.ai` |
| Storage indexer | `https://indexer-storage-testnet-turbo.0g.ai` |
| Flow contract | `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296` |
| KV stream ID | `ethers.id('parellax.v1')` |
