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
    '0xc3FeF2DDc1511e26F1CD1e23306Aff16220ad365',
    '0x8FD4AaAa4d371292C757A42A5023EEA33Cf06bC1',
    '0xe17f4d4860524CE21d5CB0FBd9A09D74B7eCf228',
    '0xfA8C2876C8163De09bA70DAD15F2e43bBFCFa3D2',
    '0xB44ed7DD11bbe05eD43D6BDDD561c94912862360',
    '0x61b594b62F44F46930c350172f740104DC1724b2',
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
