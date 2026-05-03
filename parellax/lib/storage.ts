import { Batcher, getFlowContract, Indexer, KvClient } from '@0gfoundation/0g-ts-sdk'
import { ethers } from 'ethers'

const EVM_RPC = 'https://evmrpc-testnet.0g.ai'
const INDEXER_RPC = 'https://indexer-storage-testnet-turbo.0g.ai'
const FLOW_CONTRACT = '0x22E03a6A89B950F1c82ec5e74F8eCa321a105296'
const KV_NODE_URL = process.env.OG_KV_NODE_URL ?? 'http://3.101.147.150:6789'
const STREAM_ID = ethers.id('parellax.v1')

export interface AuditEntry {
  ts: number
  intent: string
  decision: 'approved' | 'rejected'
  verificationId: string
  txHash?: string
}

function toBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s)
}

function decodeBase64(b64: string): string {
  return Buffer.from(b64, 'base64').toString('utf-8')
}

function limitKey(wallet: string): Uint8Array {
  return toBytes(`limit:${wallet.toLowerCase()}`)
}

function logKey(wallet: string): Uint8Array {
  return toBytes(`log:${wallet.toLowerCase()}`)
}

function getSigner(): ethers.Wallet {
  const pk = process.env.PRIVATE_KEY
  if (!pk) throw new Error('PRIVATE_KEY env var is required')
  const provider = new ethers.JsonRpcProvider(EVM_RPC)
  return new ethers.Wallet(pk, provider)
}

async function makeBatcher(): Promise<Batcher> {
  const signer = getSigner()
  const indexer = new Indexer(INDEXER_RPC)
  const [nodes, err] = await indexer.selectNodes(1)
  if (err !== null) throw new Error(`Failed to select nodes: ${err}`)
  const flow = getFlowContract(FLOW_CONTRACT, signer)
  return new Batcher(1, nodes, flow, EVM_RPC)
}

export async function setSpendingLimit(walletAddr: string, limitWei: bigint): Promise<string> {
  const batcher = await makeBatcher()
  batcher.streamDataBuilder.set(STREAM_ID, limitKey(walletAddr), toBytes(limitWei.toString()))
  const [result, err] = await batcher.exec()
  if (err !== null) throw new Error(`KV write failed: ${err}`)
  return result.txHash
}

export async function getSpendingLimit(walletAddr: string): Promise<bigint | null> {
  const client = new KvClient(KV_NODE_URL)
  const raw = await client.getValue(STREAM_ID, limitKey(walletAddr))
  if (!raw) return null
  return BigInt(decodeBase64(raw.data))
}

export async function appendAuditLog(walletAddr: string, entry: AuditEntry): Promise<void> {
  const client = new KvClient(KV_NODE_URL)
  const existing = await client.getValue(STREAM_ID, logKey(walletAddr))
  const log: AuditEntry[] = existing ? JSON.parse(decodeBase64(existing.data)) : []
  log.push(entry)

  const batcher = await makeBatcher()
  batcher.streamDataBuilder.set(STREAM_ID, logKey(walletAddr), toBytes(JSON.stringify(log)))
  const [, err] = await batcher.exec()
  if (err !== null) throw new Error(`Audit log write failed: ${err}`)
}

export async function getAuditLog(walletAddr: string): Promise<AuditEntry[]> {
  const client = new KvClient(KV_NODE_URL)
  const raw = await client.getValue(STREAM_ID, logKey(walletAddr))
  if (!raw) return []
  return JSON.parse(decodeBase64(raw.data))
}
