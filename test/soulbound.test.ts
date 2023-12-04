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
