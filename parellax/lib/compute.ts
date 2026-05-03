import OpenAI from 'openai'

const MODEL = 'qwen/qwen-2.5-7b-instruct'
const BASE_URL = 'https://router-api-testnet.integratenetwork.work/v1'

export interface TransactionContext {
  walletAddr: string
  amountWei: bigint
  recipient: string
  spendingLimitWei: bigint
  currentBalanceWei: bigint
}

export interface ApprovalDecision {
  approved: boolean
  reason: string
  model: string
  verificationId: string
  teeVerified: boolean
}

const SYSTEM_PROMPT = `You are a banking security agent. Evaluate transaction requests and return ONLY valid JSON.
Response schema: {"approved": boolean, "reason": string}
- Approve if within spending limit and balance is sufficient
- Reject if it exceeds the limit or balance
- Keep reason under 20 words`

function getClient(): OpenAI {
  const apiKey = process.env.OG_COMPUTE_KEY
  if (!apiKey) throw new Error('OG_COMPUTE_KEY env var is required')
  return new OpenAI({ baseURL: BASE_URL, apiKey })
}

export async function evaluateTransaction(
  intent: string,
  ctx: TransactionContext
): Promise<ApprovalDecision> {
  const client = getClient()
  const fmt = (wei: bigint) => (Number(wei) / 1e18).toFixed(6)

  const userMsg = `Intent: "${intent}"
Amount: ${fmt(ctx.amountWei)} OG
Recipient: ${ctx.recipient}
Spending limit: ${fmt(ctx.spendingLimitWei)} OG
Current balance: ${fmt(ctx.currentBalanceWei)} OG`

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMsg },
    ],
    temperature: 0,
    max_tokens: 128,
    // @ts-expect-error custom 0G field
    verify_tee: true,
  })

  const text = response.choices[0]?.message?.content ?? '{}'
  let parsed: { approved: boolean; reason: string }
  try {
    parsed = JSON.parse(text.trim())
  } catch {
    parsed = { approved: false, reason: 'TEE response parse error' }
  }

  const trace = (response as unknown as { x_0g_trace?: { tee_verified?: boolean } }).x_0g_trace

  return {
    approved: parsed.approved,
    reason: parsed.reason,
    model: response.model ?? MODEL,
    verificationId: response.id,
    teeVerified: trace?.tee_verified ?? false,
  }
}
