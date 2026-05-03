# @daiwikdomain/parellax-storage

0G KV Storage wrapper — per-wallet spending limits and append-only audit logs on the 0G decentralized network. No operator can edit entries after they are written.

```bash
npm install @daiwikdomain/parellax-storage
```

## Flow

```
your app
   │
   ├── setSpendingLimit(wallet, wei)  ──►  0G KV write (on-chain tx)
   ├── getSpendingLimit(wallet)       ──►  0G KV read  → bigint | null
   │
   ├── appendAuditLog(wallet, entry)  ──►  0G KV write (append-only)
   └── getAuditLog(wallet)            ──►  0G KV read  → AuditEntry[]
```

## Env vars

| Variable | Required | Default |
|---|---|---|
| `PRIVATE_KEY` | Yes | — signs KV write txs |
| `OG_KV_NODE_URL` | No | `http://3.101.147.150:6789` |

## Usage

```ts
import { setSpendingLimit, getSpendingLimit, appendAuditLog, getAuditLog } from '@daiwikdomain/parellax-storage'
import { parseEther } from 'ethers'

// spending limit
await setSpendingLimit('0xWallet', parseEther('1.0'))   // returns txHash
const limit = await getSpendingLimit('0xWallet')         // bigint | null

// audit log
await appendAuditLog('0xWallet', {
  ts: Date.now(),
  intent: 'pay the nanny 0.1 OG',
  decision: 'approved',
  verificationId: 'chatcmpl-abc123',
  txHash: '0xdeadbeef...',
})
const log = await getAuditLog('0xWallet')
```

## Types

```ts
interface AuditEntry {
  ts: number
  intent: string
  decision: 'approved' | 'rejected'
  verificationId: string
  txHash?: string
}
```

## Network

| | |
|---|---|
| Chain | 0G Galileo — Chain ID 16602 |
| Storage indexer | `indexer-storage-testnet-turbo.0g.ai` |
| Flow contract | `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296` |
| KV stream | `ethers.id('parellax.v1')` |
