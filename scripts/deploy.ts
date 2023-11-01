import 'dotenv/config'
import { ethers } from 'hardhat'

async function main() {
  let addrs = await ethers.getSigners()

  console.log('Deploying contracts with the account:', addrs[0].address)
  console.log(
    'Account balance:',
    (await ethers.provider.getBalance(addrs[0].address)).toString()
  )

  const PhaseOneFreeMint = await ethers.getContractFactory(
    'PhaseOneFreeMint',
    addrs[0]
  )
  const phaseOneFreeMint = await PhaseOneFreeMint.deploy(
    'https://example.com/',
    '.json'
  )
  await phaseOneFreeMint.waitForDeployment()
  console.log('Contract address:', await phaseOneFreeMint.getAddress())
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
