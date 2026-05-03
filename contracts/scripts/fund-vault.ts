import { ethers } from 'hardhat'

async function main() {
  const [signer] = await ethers.getSigners()
  const vault = process.env.VAULT_ADDRESS
  if (!vault) throw new Error('VAULT_ADDRESS not set in .env')

  const before = await ethers.provider.getBalance(vault)
  console.log('Vault balance before:', ethers.formatEther(before), 'OG')

  const tx = await signer.sendTransaction({ to: vault, value: ethers.parseEther('0.3') })
  await tx.wait()
  console.log('Funded 0.3 OG — tx:', tx.hash)

  const after = await ethers.provider.getBalance(vault)
  console.log('Vault balance after:', ethers.formatEther(after), 'OG')
}

main().catch(e => { console.error(e); process.exit(1) })
