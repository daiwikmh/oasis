import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying from:', deployer.address)

  const balance = await ethers.provider.getBalance(deployer.address)
  console.log('Balance:', ethers.formatEther(balance), 'OG')

  const Vault = await ethers.getContractFactory('ParellaxVault')
  const vault = await Vault.deploy(deployer.address)
  await vault.waitForDeployment()

  const addr = await vault.getAddress()
  console.log('ParellaxVault deployed to:', addr)
  console.log('Set VAULT_ADDRESS=' + addr + ' in your .env.local')
}

main().catch((e) => { console.error(e); process.exit(1) })
