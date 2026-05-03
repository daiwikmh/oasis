import 'dotenv/config'
import { evaluateTransaction } from './index'

async function run() {
  console.log('Calling 0G Compute (TEE)...')
  const decision = await evaluateTransaction('Pay ₹500 for coffee', {
    walletAddr: '0x1234567890abcdef1234567890abcdef12345678',
    amountWei: BigInt('500000000000000000'),
    recipient: '0xCoffeeshop',
    spendingLimitWei: BigInt('2000000000000000000'),
    currentBalanceWei: BigInt('5000000000000000000'),
  })
  console.log('approved:', decision.approved)
  console.log('reason:', decision.reason)
  console.log('model:', decision.model)
  console.log('verificationId:', decision.verificationId)
}

run().catch(console.error)
