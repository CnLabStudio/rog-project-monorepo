import { ethers } from 'hardhat'
import { expect } from 'chai'
import { PhaseOneFreeMint } from '../build/typechain'
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'

describe('PhaseOneFreeMint', () => {
  const _uriPrefix: string = 'https://example.com/'
  const _uriSuffix: string = '.json'
  let signers: SignerWithAddress[]
  let phaseOneFreeMint: PhaseOneFreeMint

  beforeEach(async () => {
    signers = await ethers.getSigners()
    phaseOneFreeMint = await ethers
      .getContractFactory('PhaseOneFreeMint')
      .then((factory) => factory.deploy(signers[0].address, _uriPrefix, _uriSuffix))
  })

  describe('airdropInPair', () => {
    it('should airdrop tokens to both addresses', async () => {
      const [_, address2] = await ethers.getSigners()
      await phaseOneFreeMint.airdropInPair(0, 1, address2.address)
      expect(await phaseOneFreeMint.balanceOf(address2.address, 0)).to.equal(1)
      expect(await phaseOneFreeMint.balanceOf(address2.address, 1)).to.equal(1)
    })

    it('should revert if not called by the owner', async () => {
      const [_, address2] = await ethers.getSigners()
      await expect(
        phaseOneFreeMint.connect(address2).airdropInPair(0, 1, address2.address)
      ).to.be.rejectedWith('Caller is not the mint role')
    })

    it('should revert if already minted', async () => {
      const [_, address2] = await ethers.getSigners()
      await phaseOneFreeMint.airdropInPair(0, 1, address2.address)
      await expect(
        phaseOneFreeMint.airdropInPair(0, 1, address2.address)
      ).to.be.rejectedWith('Already minted')
    })
  })

  describe('merge', () => {
    it('should merge two addresses into one', async () => {
      const [_, address2] = await ethers.getSigners()
      await phaseOneFreeMint.airdropInPair(0, 5, address2.address)
      await phaseOneFreeMint.connect(address2).merge(0, 5)
      expect(await phaseOneFreeMint.balanceOf(address2.address, 10)).to.equal(1)
    })
  })

  describe('uri', () => {
    it('should return the correct uri', async () => {
      for (let i = 0; i < 20; i++) {
        expect(await phaseOneFreeMint.uri(i)).to.equal(
          `${_uriPrefix}${i}${_uriSuffix}`
        )
      }
    })
  })
})
