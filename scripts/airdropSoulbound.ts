import 'dotenv/config'
import { ethers } from 'hardhat'
import { PhaseTwoSoulBound__factory } from '../build/typechain'
import * as constants from './constants'
import { getGasPrice } from './utils'

async function main() {
  let addrs = await ethers.getSigners()

  console.log('Deploying contracts with the account:', addrs[0].address)
  console.log(
    'Account balance:',
    (await ethers.provider.getBalance(addrs[0].address)).toString()
  )

  const phaseTwoSoulBound = PhaseTwoSoulBound__factory.connect(
    constants.phaseTwoSoulBoundAddr,
    addrs[0]
  )
  console.log('Contract address:', await phaseTwoSoulBound.getAddress())

  const airdropList = [
    '0x102DE2b924B901521c98E335E3D01cfAF28Ce240',
    '0x96B4Df8D9F38806cdBB799041aedC61Bc8a1f7ab',
  ]

  for (const address of airdropList) {
    if (ethers.isAddress(address)) {
      console.log('Minting to address:', address)
      const { maxFeePerGas, maxPriorityFeePerGas } = await getGasPrice()

      await phaseTwoSoulBound.mintGiveawayTokens(address, 1, {
        maxFeePerGas,
        maxPriorityFeePerGas,
      })
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
