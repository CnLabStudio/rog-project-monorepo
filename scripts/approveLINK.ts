import 'dotenv/config'
import { ethers } from 'hardhat'
import { PhaseThreeAvatar__factory, IERC20__factory } from '../build/typechain'
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

  const linkBalance = await IERC20__factory.connect(
    constants.linkAddr,
    addrs[0]
  ).balanceOf(addrs[0].address)

  console.log('linkBalance:', linkBalance.toString())

  await IERC20__factory.connect(constants.linkAddr, addrs[0]).approve(
    await phaseThreeAvatar.getAddress(),
    linkBalance
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
