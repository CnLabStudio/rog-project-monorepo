import 'dotenv/config'
import { ethers } from 'hardhat'

async function main() {
  let addrs = await ethers.getSigners()

  console.log('Deploying contracts with the account:', addrs[0].address)
  console.log(
    'Account balance:',
    (await ethers.provider.getBalance(addrs[0].address)).toString()
  )

  const PhaseOneFreeMint = await ethers.getContractFactory(
    'PhaseOneFreeMint',
    addrs[0]
  )
  const phaseOneFreeMint = PhaseOneFreeMint.attach(
    '0xA2fD0Da25F0662e490bA5403D097B7D8575A76eA'
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
