import 'dotenv/config'
import { setSpendingLimit, getSpendingLimit, appendAuditLog, getAuditLog } from './index'

const WALLET = process.env.TEST_WALLET ?? '0x1234567890abcdef1234567890abcdef12345678'

async function run() {
  const limit = BigInt('500000000000000000') // 0.5 ETH in wei
  console.log('Writing spending limit to 0G KV...')
  const tx = await setSpendingLimit(WALLET, limit)
  console.log('tx:', tx)

  console.log('Reading back...')
  const got = await getSpendingLimit(WALLET)
  console.log('limit:', got?.toString(), got === limit ? '✓' : '✗ mismatch')

  console.log('Appending audit log...')
  await appendAuditLog(WALLET, {
    ts: Date.now(),
    intent: 'Pay for coffee',
    decision: 'approved',
    verificationId: 'cmpl-test-123',
    txHash: '0xdeadbeef',
  })

  const log = await getAuditLog(WALLET)
  console.log('log entries:', log.length, log[0]?.intent)
}

run().catch(console.error)
