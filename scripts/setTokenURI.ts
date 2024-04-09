import 'dotenv/config'
import { ethers } from 'hardhat'
import {
  PhaseOneFreeMint__factory,
  PhaseTwoSoulBound__factory,
  PhaseThreeAvatar__factory,
} from '../build/typechain'
import * as constants from './constants'

async function main() {
  let addrs = await ethers.getSigners()

  console.log('Deploying contracts with the account:', addrs[0].address)
  console.log(
    'Account balance:',
    (await ethers.provider.getBalance(addrs[0].address)).toString()
  )
  /*
  const phaseOneFreeMint = PhaseOneFreeMint__factory.connect(
    constants.phaseOneFreeMintAddr,
    addrs[0]
  )
  console.log('Contract address:', await phaseOneFreeMint.getAddress())

  await phaseOneFreeMint.setURI(
    'ipfs://QmVP4B73SedN65s91rv26ihoYWkCYe2v5EXpNEhtkpCrQW/',
    '.json'
  )
  QmNhUw4Xv9jj6h2NRqf2fm8nZBNRNzFwDXJ5BLwLWWVKRF
  */

  /*
  const phaseTwoSoulBound = PhaseTwoSoulBound__factory.connect(
    constants.phaseTwoSoulBoundAddr,
    addrs[0]
  )
  console.log('Contract address:', await phaseTwoSoulBound.getAddress())

  await phaseTwoSoulBound.setURI(
    'ipfs://QmRuqLDVH66MGXXBVSVJBUhnqPuMP7PdRuU9KaNPLn85aF/',
    '.json'
  )
  */
  
  
  const phaseThreeAvatar = PhaseThreeAvatar__factory.connect(
    constants.phaseThreeAvatarAddr,
    addrs[0]
  )
  console.log('Contract address:', await phaseThreeAvatar.getAddress())

  await phaseThreeAvatar.setURI(
    'https://vq1a6y8671.execute-api.ap-southeast-1.amazonaws.com/metadata/',
    ''
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
