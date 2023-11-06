import 'dotenv/config'
import { ethers } from 'hardhat'
import { PhaseOneFreeMint__factory } from '../build/typechain'

async function main() {
  let addrs = await ethers.getSigners()

  console.log('Deploying contracts with the account:', addrs[0].address)
  console.log(
    'Account balance:',
    (await ethers.provider.getBalance(addrs[0].address)).toString()
  )

  const phaseOneFreeMint = PhaseOneFreeMint__factory.connect(
    '0xA2fD0Da25F0662e490bA5403D097B7D8575A76eA',
    addrs[0]
  )
  console.log('Contract address:', await phaseOneFreeMint.getAddress())

  await phaseOneFreeMint.setURI(
    'ipfs://QmatE35xdAttfiwHTZdCiTJDWajVHMXy4uTVH7PfjnqGSZ/',
    '.json'
  )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
