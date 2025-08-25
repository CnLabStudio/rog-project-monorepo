import 'dotenv/config'
import { ethers } from 'hardhat'
import { PhaseThreeAvatar__factory } from '../build/typechain'
import { getGasPrice } from './utils'
import * as constants from './constants'

const { RUNTIME_PARAMS } = require('../config/deploy-avatar-params')

async function main() {
  let addrs = await ethers.getSigners()

  console.log('Setting parameters with account:', addrs[0].address)
  console.log('Account balance:', ethers.formatEther(await ethers.provider.getBalance(addrs[0].address)))

  const phaseThreeAvatar = PhaseThreeAvatar__factory.connect(
    constants.phaseThreeAvatarAddr,
    addrs[0]
  )
  console.log('Contract address:', await phaseThreeAvatar.getAddress())

  const gasOptions = { 
    maxFeePerGas: ethers.parseUnits('10', 'gwei'),
    maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
  }

  console.log('Setting parameters:', RUNTIME_PARAMS)

  await phaseThreeAvatar.setSoulboundStartMintTime(RUNTIME_PARAMS.soulboundStartTime, gasOptions)
  await phaseThreeAvatar.setSoulboundEndMintTime(RUNTIME_PARAMS.soulboundEndTime, gasOptions)
  await phaseThreeAvatar.setPublicStartMintTime(RUNTIME_PARAMS.publicStartTime, gasOptions)
  await phaseThreeAvatar.setMintPrice(RUNTIME_PARAMS.mintPrice, gasOptions)

  console.log('Parameters set successfully')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  }) 