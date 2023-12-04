import 'dotenv/config'
import { ethers } from 'hardhat'
import { PhaseThreeAvatar__factory } from '../build/typechain'
import { getGasPrice } from './utils'

async function main() {
  const avatarAddr = '0x1D507ba0e0BdF7694A258583420BEdd80A38aF93'
  let addrs = await ethers.getSigners()

  console.log('Deploying contracts with the account:', addrs[0].address)
  console.log(
    'Account balance:',
    (await ethers.provider.getBalance(addrs[0].address)).toString()
  )

  const phaseThreeAvatar = PhaseThreeAvatar__factory.connect(
    avatarAddr,
    addrs[0]
  )
  console.log('Contract address:', await phaseThreeAvatar.getAddress())

  const { maxFeePerGas, maxPriorityFeePerGas } = await getGasPrice()

  await phaseThreeAvatar.requestRandomWords({
    maxFeePerGas,
    maxPriorityFeePerGas,
  })
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
