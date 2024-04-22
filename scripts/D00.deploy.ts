import 'dotenv/config'
import { ethers } from 'hardhat'
import { getGasPrice } from './utils'
import * as constants from './constants'

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
    addrs[0].address,
    'ipfs://QmVP4B73SedN65s91rv26ihoYWkCYe2v5EXpNEhtkpCrQW/',
    '.json'
  )
  await phaseOneFreeMint.waitForDeployment()
  console.log('Contract address:', await phaseOneFreeMint.getAddress())
  
  const PhaseTwoSoulBound = await ethers.getContractFactory(
    'PhaseTwoSoulBound',
    addrs[0]
  )
  const phaseTwoSoulBound = await PhaseTwoSoulBound.deploy(
    addrs[0].address,
    'ipfs://QmNhUw4Xv9jj6h2NRqf2fm8nZBNRNzFwDXJ5BLwLWWVKRF/',
    '.json'
  )
  await phaseTwoSoulBound.waitForDeployment()
  console.log('Contract address:', await phaseTwoSoulBound.getAddress())

  // Deploy
  // Approve
  // SetRandomSeed
  /*
  const PhaseThreeAvatar = await ethers.getContractFactory(
    'PhaseThreeAvatar',
    addrs[0]
  )
  const phaseThreeAvatar = await PhaseThreeAvatar.deploy(
    addrs[0].address,
    addrs[0].address,
    10000,
    1000,
    constants.linkAddr,
    constants.vrfWrapper,
    500_000,
    3,
    'hash',
    'ipfshash'
  )
  await phaseThreeAvatar.waitForDeployment()
  console.log('Contract address:', await phaseThreeAvatar.getAddress())
  */
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
