import { createPublicClient, http } from 'viem'

const OG_CHAIN = {
  id: 16602,
  name: '0G Galileo',
  network: 'galileo',
  nativeCurrency: { name: 'OG', symbol: 'OG', decimals: 18 },
  rpcUrls: { default: { http: ['https://evmrpc-testnet.0g.ai'] } },
} as const

export async function GET() {
  const vault = process.env.VAULT_ADDRESS as `0x${string}`
  if (!vault) return Response.json({ balance: '0' })

  try {
    const client = createPublicClient({ chain: OG_CHAIN, transport: http() })
    const balance = await client.getBalance({ address: vault })
    return Response.json({ balance: balance.toString() })
  } catch {
    return Response.json({ balance: '0' })
  }
}
