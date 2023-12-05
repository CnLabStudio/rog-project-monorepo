import 'dotenv/config'
import { ethers } from 'hardhat'
import { PhaseThreeAvatar__factory } from '../build/typechain'
import { getGasPrice } from './utils'

async function main() {
  const avatarAddr = '0xd58aC241af832Bd588282932F4Dbb0f85F51DF55'
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
