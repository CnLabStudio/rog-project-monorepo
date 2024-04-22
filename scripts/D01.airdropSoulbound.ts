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
    '0xad7019432DeE3ee6C63c345A84b18337C7AC6298',
    '0x8aD1F10926A9cf9906E57d03C28da8CE78b61217',
    '0x28925E700c987A032829a2DadCeD525119b9D65e',
    '0x6436f0cD6b0833b64a1d60189457c67daf57648A',
    '0x8C7e7CC7aEE0e966d643a32980901b32cF171790',
    '0xAE58415474d1655d9A47844C1771e6Dd0d82Bfb1',
    '0xAd8873366400dc94B33F43d4072926c7Bb3CA7c5',
    '0x769182426f10Db6531BcDa6F8b821D60db82373b',
    '0x13AFf4E8748874DD90a3AeCBFa0344221fbf7a35',
    '0x51b22f7c87aFeaB4D038Ec7D5C550Ff71665E64D',
    '0xB4993eD5511Fef95b36154e4192994520c1352BF',
    '0xc3FeF2DDc1511e26F1CD1e23306Aff16220ad365',
    '0x8FD4AaAa4d371292C757A42A5023EEA33Cf06bC1',
    '0xe17f4d4860524CE21d5CB0FBd9A09D74B7eCf228',
    '0xfA8C2876C8163De09bA70DAD15F2e43bBFCFa3D2',
    '0xB44ed7DD11bbe05eD43D6BDDD561c94912862360',
    '0x61b594b62F44F46930c350172f740104DC1724b2',
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
