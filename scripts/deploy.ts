import 'dotenv/config'
import { ethers } from 'hardhat'

async function main() {
  let addrs = await ethers.getSigners()

  console.log('Deploying contracts with the account:', addrs[0].address)
  console.log(
    'Account balance:',
    (await ethers.provider.getBalance(addrs[0].address)).toString()
  )

  /*
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
  */
  /*
  const PhaseTwoSoulBound = await ethers.getContractFactory(
    'PhaseTwoSoulBound',
    addrs[0]
  )
  const phaseTwoSoulBound = await PhaseTwoSoulBound.deploy(
    addrs[0].address,
    'ipfs://QmZTBfck7nH699bLY9mJrhcFtvWo9MSKgrPQx9SY7L6qFX/',
    '.json'
  )
  await phaseTwoSoulBound.waitForDeployment()
  console.log('Contract address:', await phaseTwoSoulBound.getAddress())
  */

  const PhaseThreeAvatar = await ethers.getContractFactory(
    'PhaseThreeAvatar',
    addrs[0]
  )
  const phaseThreeAvatar = await PhaseThreeAvatar.deploy(
    addrs[0].address,
    '0xe9EAa7Ac84dca4f68F763CE9743A751C6d9c24dc', //phaseTwoSoulBound.getAddress(),
    10000,
    1000,
    '0x326C977E6efc84E512bB9C30f76E30c160eD06FB',
    '0x99aFAf084eBA697E584501b8Ed2c0B37Dd136693',
    500_000,
    3,
    'hash',
    'ipfshash'
  )
  await phaseThreeAvatar.waitForDeployment()
  console.log('Contract address:', await phaseThreeAvatar.getAddress())
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
