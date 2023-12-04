import 'dotenv/config'
import { ethers } from 'hardhat'
import { PhaseTwoSoulBound__factory } from '../build/typechain'

async function main() {
  let addrs = await ethers.getSigners()

  console.log('Deploying contracts with the account:', addrs[0].address)
  console.log(
    'Account balance:',
    (await ethers.provider.getBalance(addrs[0].address)).toString()
  )

  const phaseTwoSoulBound = PhaseTwoSoulBound__factory.connect(
    '0xe9EAa7Ac84dca4f68F763CE9743A751C6d9c24dc',
    addrs[0]
  )
  console.log('Contract address:', await phaseTwoSoulBound.getAddress())

  const airdropList = [
    '0x51b22f7c87aFeaB4D038Ec7D5C550Ff71665E64D',
    '0x96b4df8d9f38806cdbb799041aedc61bc8a1f7ab',
    '0xaDF035b3e492C7c1A753F5eAEc7068B53d5C0bF0',
    '0xe33168Cc88Ab4C8099A0c44F13bd4228a3f859ed',
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
