import 'dotenv/config'
import { ethers } from 'hardhat'
import { PhaseThreeAvatar__factory } from '../build/typechain'
import { getGasPrice } from './utils'
import * as constants from './constants'

async function main() {
  let addrs = await ethers.getSigners()

  console.log('Deploying contracts with the account:', addrs[0].address)
  console.log(
    'Account balance:',
    (await ethers.provider.getBalance(addrs[0].address)).toString()
  )

  const phaseThreeAvatar = PhaseThreeAvatar__factory.connect(
    constants.phaseThreeAvatarAddr,
    addrs[0]
  )
  console.log('Contract address:', await phaseThreeAvatar.getAddress())

  const { paid, fulfilled, randomWords } =
    await phaseThreeAvatar.getRequestStatus()

  console.log('paid:', paid)
  console.log('fulfilled:', fulfilled)
  console.log('randomWords:', randomWords)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
