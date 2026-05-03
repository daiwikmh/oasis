# Parellax

**Verifiable Orchestration Layer for Agentic Banking**

Natural-language financial intent → TEE-sealed AI decision → ECDSA-gated on-chain execution. Every step is cryptographically verifiable. No operator can tamper with the reasoning or the audit trail.

> The agent is not trusted. The cryptography is.

---

## The Problem

Every AI finance tool today is a black box. The model decides, money moves, you get a receipt. Three things are missing:

- **Verifiability** — no cryptographic proof the AI computed what it claims. A server log is an operator's claim, not evidence.
- **Enforcement** — spending rules live in application logic that can be bypassed, updated, or compromised. Nothing enforces them at the contract level.
- **Auditability** — no tamper-proof record of decisions. If the operator controls the log server, the operator controls the history.

Parellax solves all three using 0G's three primitives as the enforcement layer, not as infrastructure decoration.

---

## Pipeline

```
User
 │
 │  "pay the nanny 0.1 OG"
 ▼
┌─────────────────────────────────────────────────────────┐
│  /api/transact                          (SSE streaming) │
│                                                         │
│  1. Read spending limit ──► 0G KV Storage               │
│        │                    keyed by wallet address     │
│        ├─ amount > limit ──► REJECTED (logged to KV)    │
│        │                                                │
│  2. TEE Evaluation ────────► 0G Compute (Qwen 2.5 7B)   │
│        │  verify_tee: true                              │
│        │  returns: { approved, reason, verificationId } │
│        │           teeVerified: true                    │
│        ├─ rejected ────────► REJECTED (logged to KV)    │
│        │                                                │
│  3. Sign payload ──────────► verifiedBrain key          │
│        │  keccak256(to + amount + verificationId)       │
│        │                                                │
│  4. Release ───────────────► ParellaxVault.release()    │
│        │  ✓ verifies ECDSA signature                    │
│        │  ✓ checks vault balance                        │
│        │  ✓ replay protection via verificationId        │
│        │  funds transfer                                │
│        │                                                │
│  5. Audit log ─────────────► 0G KV Storage (append)     │
│        intent + decision + verificationId + txHash      │
└─────────────────────────────────────────────────────────┘
```

Every stage streams live to the Thinking Terminal in the dashboard via SSE. Nothing is hidden.

---

## 0G Integration

```
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│   0G Storage     │   │   0G Compute     │   │   0G Chain       │
│                  │   │                  │   │                  │
│  KV stream:      │   │  Qwen 2.5 7B     │   │  ParellaxVault   │
│  parellax.v1     │   │  in TEE enclave  │   │  Galileo testnet │
│                  │   │                  │   │                  │
│  • spending limit│   │  • sealed infer  │   │  • ECDSA-gated   │
│  • audit log     │   │  • verify_tee    │   │  • replay proof  │
│  keyed by wallet │   │  • returns ID    │   │  • no admin bypass│
└──────────────────┘   └──────────────────┘   └──────────────────┘
       reads/writes            evaluates              settles
       before + after          on approval            funds
```

Each primitive is load-bearing. Remove 0G Storage and spending limits become operator-controlled. Remove 0G Compute and the AI decision has no cryptographic proof. Remove 0G Chain and fund release is enforced only in application logic.

---

## Security Model

| Property | Mechanism |
|---|---|
| AI cannot act unilaterally | Vault requires server sig; server only signs after TEE approval |
| Operator cannot override | No admin function on vault; no bypass path exists in the contract |
| Replay attacks blocked | Each `verificationId` can authorize exactly one release |
| Spending limits are sovereign | Stored on 0G KV, not in app DB; operator cannot silently raise them |
| Audit trail is immutable | 0G KV append-only; no operator, including Parellax, can edit entries |

---

## npm Packages

The storage and compute layers are extracted as standalone open-source packages — usable in any Node.js or Next.js project without the full Parellax stack.

```bash
npm install @daiwikdomain/parellax-storage   # 0G KV — limits + audit logs
npm install @daiwikdomain/parellax-compute   # 0G Compute TEE — transaction eval
```

**parellax-storage** exports: `setSpendingLimit` `getSpendingLimit` `appendAuditLog` `getAuditLog`

**parellax-compute** exports: `evaluateTransaction` → `{ approved, reason, verificationId, teeVerified }`

```ts
// storage
await setSpendingLimit('0xWallet', parseEther('1.0'))
const log = await getAuditLog('0xWallet')

// compute
const decision = await evaluateTransaction('pay the nanny 0.1 OG', {
  walletAddr, amountWei, recipient, spendingLimitWei, currentBalanceWei
})
// decision.verificationId → pass to vault contract as one-time nonce
```

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.2.4, React 19, Tailwind v4 |
| Wallet | wagmi v3, viem v2, @metamask/connect-evm |
| Contracts | Solidity 0.8.28, Hardhat 2, OpenZeppelin ECDSA |
| 0G Storage | `@0gfoundation/0g-ts-sdk` KvClient + Batcher |
| 0G Compute | `openai` SDK → `router-api-testnet.integratenetwork.work/v1` |
| 0G Chain | viem WalletClient + PublicClient |
| Streaming | Server-Sent Events via ReadableStream |

---

## Deployed

| | |
|---|---|
| ParellaxVault | `0x84e57567758B1143BD285eED2cbD574187a1D710` |
| verifiedBrain | `0x445bf5fe58f2Fe5009eD79cFB1005703D68cbF85` |
| Network | 0G Galileo — Chain ID 16602 |
| RPC | `https://evmrpc-testnet.0g.ai` |
| Vault balance | 0.3 OG |
| Storage indexer | `https://indexer-storage-testnet-turbo.0g.ai` |
| KV stream | `ethers.id('parellax.v1')` |
| Compute router | `https://router-api-testnet.integratenetwork.work/v1` |

---

## Env vars

```bash
PRIVATE_KEY=       # signs vault releases + KV writes
OG_COMPUTE_KEY=    # 0G Compute router API key
VAULT_ADDRESS=     # deployed ParellaxVault address
OG_KV_NODE_URL=    # optional, defaults to http://3.101.147.150:6789
```

---

## Run

```bash
# app
cd parellax && npm run dev

# deploy contract
cd contracts && npx hardhat run scripts/deploy.ts --network galileo

# fund vault
cd contracts && VAULT_ADDRESS=<address> npx hardhat run scripts/fund-vault.ts --network galileo
```

---

## Contract interface

```
receive()                                      — accept OG deposits
deposit()                                      — explicit deposit
release(to, amount, verificationId, signature) — ECDSA-verified release
balance()                                      — vault balance
setVerifiedBrain(address)                      — owner only
```

Message hash: `keccak256(abi.encodePacked(to, amount, verificationId))` wrapped with Ethereum signed message prefix. Replay protection via `mapping(bytes32 => bool)` of used verification IDs.

---

Built for the 0G Hackathon — Galileo Testnet Edition.
