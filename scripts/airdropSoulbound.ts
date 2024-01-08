import 'dotenv/config'
import { ethers } from 'hardhat'
import { PhaseTwoSoulBound__factory } from '../build/typechain'
import * as constants from './constants'

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
    '0x45F571d30157a2E548A9a5789F69558aC56955dA',
    '0xad7019432DeE3ee6C63c345A84b18337C7AC6298',
  ]

  for (const address of airdropList) {
    console.log('Minting to address:', address)

    await phaseTwoSoulBound.mintGiveawayTokens(address, 1)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
