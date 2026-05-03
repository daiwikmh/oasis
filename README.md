# Parellax

**Verifiable Orchestration Layer for Agentic Banking**

Parellax answers a question that every agentic finance system quietly avoids: how do you know the AI actually did what it said it did, and that it had permission to do it?

Every existing AI finance tool is a black box. The model decides. A transaction fires. You get a receipt. There is no proof of what reasoning happened, no on-chain enforcement of rules you set, and no way to verify after the fact that the agent operated within its authorized scope. You are trusting the software unconditionally.

Parellax eliminates that trust assumption entirely. It is a complete orchestration layer that takes a natural-language financial intent — "pay the nanny $200" — and executes it through a three-stage pipeline where every step produces a cryptographic artifact. The reasoning is sealed in a Trusted Execution Environment. The approval is a verifiable ECDSA signature. The execution is gated by an on-chain vault that physically cannot release funds without that signature. The audit log is written to a decentralized key-value store that neither the application nor any operator can modify after the fact.

The agent is not trusted. The cryptography is.

---

## The Problem

Autonomous agents handling money face a trilemma that no current solution resolves completely:

**Verifiability.** If an AI makes a financial decision, how do you prove what it decided and why? A server log is not a proof — it is a claim made by the operator. Without TEE-sealed computation, there is no cryptographic evidence that the inference happened as described.

**Enforcement.** Spending rules set by users are typically enforced in application logic. That logic can be bypassed, updated, or compromised. There is no on-chain mechanism that makes rule violations physically impossible rather than merely disallowed.

**Auditability.** Every action taken by an autonomous financial agent should be reconstructable after the fact by any party, without relying on a centralized log server. Decentralized, immutable audit trails do not exist in any deployed agentic finance system today.

Parellax solves all three simultaneously using 0G's infrastructure stack.

---

## How It Works

### 1. Intent

The user expresses a financial intent in plain language. No transaction builder. No form with gas fields and hex addresses. Just what they want to do and who should receive it.

The intent arrives at the Parellax API, which first checks the user's spending limit from 0G KV Storage. The limit is stored on-chain under the user's wallet address as the key — not in a database the operator controls. If the amount exceeds the limit, the request is rejected before reaching the AI at all.

### 2. TEE Evaluation

If the amount is within the limit, the intent and its financial context — amount in wei, recipient, spending limit, current vault balance — are submitted to 0G Compute running Llama 3.3 70B inside a Trusted Execution Environment.

The TEE evaluates the request against the user's rules and the financial parameters. It returns a decision object: approved or rejected, with a reason, and a verification ID that is the unique identifier for this inference run. The inference is TEE-sealed: the computation happens inside an enclave that the host machine cannot inspect or tamper with. The verification ID is the proof that this specific decision came from this specific inference run.

No approval, no signature. No signature, no funds.

### 3. On-Chain Settlement

On approval, the server constructs the release payload — recipient address, amount in wei, verification ID — and signs it with the deployer key, which is registered as the `verifiedBrain` in the vault contract.

The payload and signature are submitted to `ParellaxVault.release()` on the 0G Galileo testnet. The contract independently verifies three things before releasing any funds:

- The ECDSA signature matches the registered `verifiedBrain`
- The vault has sufficient balance
- The verification ID has never been used before (replay protection)

If all three pass, funds are transferred. If any fail, the transaction reverts. There is no code path that releases funds without a valid signature from a TEE-approved decision.

### 4. Audit Log

Whether the decision is approved or rejected, an audit entry is appended to the user's log on 0G KV Storage. The log records the timestamp, the original intent, the decision, the verification ID, and the transaction hash if funds moved. This log is stored on the 0G network under a stream keyed to the user's wallet address. It is append-only by design. No operator, including Parellax itself, can edit or delete entries after they are written.

---

## Features

### Cryptographically Verifiable AI Decisions
Every approval produced by Parellax carries a verification ID from 0G Compute's TEE. The inference happened inside a sealed enclave. The ID is the receipt. This is not a log entry in a database — it is a cryptographic artifact tied to a specific inference run in a specific TEE session.

### ECDSA-Gated Vault
`ParellaxVault.sol` is an on-chain treasury that enforces spending authorization at the contract level. The vault does not have an admin override. It does not have an emergency withdrawal function callable by the operator. The only path to release funds is `release()` with a valid signature from the registered `verifiedBrain`. Replay attacks are blocked by a mapping of used verification IDs.

### User-Sovereign Spending Limits
Spending limits are stored on 0G KV Storage keyed by wallet address. The user sets them. They are read directly by the server at evaluation time. They are not stored in the application's database — which means the operator cannot silently raise your limit to allow a transaction you would have rejected.

### Decentralized Immutable Audit Trail
Every decision — approval or rejection — is written to 0G KV Storage. The audit log is not a table in a Postgres database. It is a structured append to a decentralized key-value store. Any party with the user's wallet address can reconstruct the full decision history independently.

### Real-Time Streaming Pipeline
The `/api/transact` endpoint streams server-sent events to the dashboard as each stage of the pipeline executes. The Thinking Terminal in the dashboard shows live: the KV limit check, the TEE evaluation, the decision and reason, the transaction submission, and the block confirmation. Nothing is hidden. Every stage is visible.

### MetaMask Wallet Integration
The dashboard connects to MetaMask and automatically prompts the user to add the 0G Galileo network if it is not already configured. The connected wallet address is used as the key for all KV storage operations — spending limits and audit logs are scoped to the specific wallet, not to a user account in the application.

### Rejection as a First-Class Feature
Parellax treats rejection as a meaningful outcome, not an error. When the TEE rejects a transaction — whether for exceeding the spending limit or for semantic reasons the model identifies in the intent — the rejection is logged to 0G KV Storage with its verification ID. The user can audit every rejection, not just every transfer.

---

## 0G Ecosystem Integration

Parellax is built as a complete integration of 0G's three core primitives. Each primitive is load-bearing — removing any one of them breaks the verifiability guarantees of the system.

**0G Storage (KV)**
Used for two distinct purposes: user spending limits and append-only audit logs. Both are stored in a single 0G KV stream identified by `ethers.id('parellax.v1')`. Each user's data is keyed by their wallet address. The 0G KV client reads limits at evaluation time and writes audit entries after every decision. The data lives on the 0G network, not in any database controlled by Parellax.

- Indexer: `https://indexer-storage-testnet-turbo.0g.ai`
- Flow contract: `0x22E03a6A89B950F1c82ec5e74F8eCa321a105296`
- Stream ID: `ethers.id('parellax.v1')`
- SDK: `@0gfoundation/0g-ts-sdk@^1.2.6`

**0G Compute (TEE)**
The inference endpoint at `https://router-api.0g.ai/v1` is OpenAI-API-compatible and runs inside a Trusted Execution Environment. Parellax sends the intent, amount, recipient, spending limit, and vault balance to Llama 3.3 70B. The response is a structured JSON decision with a unique ID. The TEE sealing means the host cannot modify the inference — the decision reflects what the model actually computed, not what any intermediary claims it computed.

- Endpoint: `https://router-api.0g.ai/v1`
- Model: `meta-llama/Llama-3.3-70B-Instruct`

**0G Chain (Galileo Testnet)**
The `ParellaxVault` smart contract is deployed on the 0G Galileo testnet. It is the final enforcement layer. Every release requires a valid ECDSA signature from the registered `verifiedBrain` address. The contract is written in Solidity 0.8.28 compiled with the Cancun EVM target and IR-based optimization.

- Chain ID: `16602`
- RPC: `https://evmrpc-testnet.0g.ai`
- Vault: `0x84e57567758B1143BD285eED2cbD574187a1D710`
- Deployer / verifiedBrain: `0x445bf5fe58f2Fe5009eD79cFB1005703D68cbF85`

---

## Technical Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.2.4, React 19.2, Tailwind CSS v4 |
| Wallet | wagmi v3, viem v2, MetaMask (injected connector) |
| Smart Contracts | Solidity 0.8.28, Hardhat 2.28.6, OpenZeppelin ECDSA |
| 0G Storage | `@0gfoundation/0g-ts-sdk` KvClient + Batcher |
| 0G Compute | OpenAI-compatible client via `openai` SDK |
| 0G Chain | viem `WalletClient` + `PublicClient` |
| Streaming | Server-Sent Events via `ReadableStream` |

---

## Environment Variables

| Variable | Description |
|---|---|
| `PRIVATE_KEY` | Deployer wallet private key — signs vault releases |
| `OG_COMPUTE_KEY` | API key for 0G Compute router |
| `VAULT_ADDRESS` | Deployed `ParellaxVault` contract address |
| `OG_KV_NODE_URL` | 0G KV node URL (defaults to `http://3.101.147.150:6789`) |

---

## Deployment

**Deploy the vault**

```bash
cd contracts
npx hardhat run scripts/deploy.ts --network galileo
```

Set `VAULT_ADDRESS` in `parellax/.env.local` with the deployed address.

**Fund the vault**

```bash
cd contracts
VAULT_ADDRESS=<address> npx hardhat run scripts/fund-vault.ts --network galileo
```

**Run the application**

```bash
cd parellax
npm run dev
```

---

## Smart Contract

`ParellaxVault` is a minimal, auditable contract with one job: hold funds and release them only on verified authorization.

```
receive()           — accepts native OG deposits
deposit()           — explicit deposit with event emission
release(to, amount, verificationId, signature)
                    — verifies ECDSA signature against verifiedBrain,
                      checks balance, enforces replay protection,
                      transfers funds
balance()           — returns current vault balance
setVerifiedBrain()  — owner-only brain address update
```

The contract uses OpenZeppelin's `ECDSA` and `MessageHashUtils` for signature verification. The message hash is `keccak256(abi.encodePacked(to, amount, verificationId))` wrapped with the Ethereum signed message prefix. Replay protection is enforced via a `mapping(bytes32 => bool)` of used verification IDs — each TEE inference ID can authorize exactly one release.

---

## Security Properties

**No unilateral agent action.** The AI cannot move funds on its own. The ECDSA vault requires a server signature, and the server only signs after a TEE approval. The entire pipeline must complete successfully for any funds to move.

**No operator override.** The vault has no admin function that bypasses signature verification. The operator cannot release funds by calling a privileged method. The only release path is through the full verification pipeline.

**Replay protection.** Each verification ID can be used once. A TEE approval cannot be resubmitted to release funds a second time.

**User-controlled limits.** Spending limits are stored on 0G KV, not in operator-controlled storage. The server reads the limit before every evaluation. A limit of zero prevents all releases regardless of what the AI decides.

**Immutable audit trail.** Audit log entries are written to 0G KV Storage. Entries are appended, never updated. The log is readable by any party with the wallet address and access to the 0G network.

---

Built for the 0G Hackathon — Galileo Testnet Edition.
