import 'dotenv/config'
import { ethers } from 'hardhat'
import { PhaseThreeAvatar__factory } from '../build/typechain'
import { getGasPrice } from './utils'
import * as constants from './constants'

async function main() {
  let addrs = await ethers.getSigners()

  console.log('Setting random seed with the account:', addrs[0].address)
  console.log(
    'Account balance:',
    (await ethers.provider.getBalance(addrs[0].address)).toString()
  )

  const phaseThreeAvatar = PhaseThreeAvatar__factory.connect(
    constants.phaseThreeAvatarAddr,
    addrs[0]
  )
  console.log('Contract address:', await phaseThreeAvatar.getAddress())

  const randomSeed = ethers.toBigInt(ethers.randomBytes(32))
  console.log('Generated random seed:', randomSeed.toString())

  const { maxFeePerGas, maxPriorityFeePerGas } = await getGasPrice()

  const tx = await phaseThreeAvatar.setRandomSeed(randomSeed, {
    maxFeePerGas,
    maxPriorityFeePerGas,
  })

  console.log('Transaction hash:', tx.hash)
  await tx.wait()
  console.log('Random seed set successfully!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
