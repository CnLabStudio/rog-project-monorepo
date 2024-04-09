import { ethers } from 'hardhat'
import { expect } from 'chai'
import { PhaseTwoSoulBound } from '../build/typechain'
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'

describe('PhaseTwoSoulBound', function () {
  const _uriPrefix: string = 'https://example.com/'
  const _uriSuffix: string = '.json'
  let signers: SignerWithAddress[]
  let phaseTwoSoulBound: PhaseTwoSoulBound

  beforeEach(async () => {
    signers = await ethers.getSigners()
    phaseTwoSoulBound = await ethers
      .getContractFactory('PhaseTwoSoulBound')
      .then((factory) =>
        factory.deploy(signers[0].address, _uriPrefix, _uriSuffix)
      )
  })

  describe('mintGiveawayTokens', function () {
    it('should revert if not called by the owner', async function () {
      await expect(
        phaseTwoSoulBound
          .connect(signers[1])
          .mintGiveawayTokens(signers[0].address, 1)
      ).to.be.revertedWith('Caller is not the mint role')
    })

    it('should mint tokens to the recipient', async function () {
      await phaseTwoSoulBound.connect(signers[0]).mintGiveawayTokens(signers[0].address, 1)
      expect(await phaseTwoSoulBound.balanceOf(signers[0].address)).to.equal(
        1
      )
    })
  })

  describe('transferFrom', function () {
    it('should not be able to transfer tokens from one address to another', async function () {
      // Mint some tokens to the owner
      await phaseTwoSoulBound.mintGiveawayTokens(signers[0].address, 1)

      // Transfer the tokens from the owner to the recipient
      await expect(
        phaseTwoSoulBound.safeTransferFrom(
          signers[0].address,
          signers[1].address,
          0
        )
      ).to.be.revertedWithCustomError(phaseTwoSoulBound, 'TokenIsSoulbound')
    })
  })
})
