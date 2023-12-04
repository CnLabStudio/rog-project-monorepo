import { ethers } from 'hardhat'
import { expect } from 'chai'
import { IERC20__factory, PhaseTwoSoulBound } from '../build/typechain'
import { PhaseThreeAvatar } from '../build/typechain'
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'

describe('PhaseThreeAvatar', () => {
  let signers: SignerWithAddress[]
  let controller: SignerWithAddress
  let phaseTwoSoulBound: PhaseTwoSoulBound
  let phaseThreeAvatar: PhaseThreeAvatar

  const _uriPrefix: string = 'https://example.com/'
  const _uriSuffix: string = '.json'

  const _maxSupply: number = 10000
  const _royaltyFee: number = 1000
  const _linkAddress: string = '0x326C977E6efc84E512bB9C30f76E30c160eD06FB'
  const _wrapperAddress: string = '0x99aFAf084eBA697E584501b8Ed2c0B37Dd136693'
  const _callbackGasLimit: number = 100_000
  const _requestConfirmations: number = 3

  beforeEach(async () => {
    signers = await ethers.getSigners()
    controller = signers[0]
    phaseTwoSoulBound = await ethers
      .getContractFactory('PhaseTwoSoulBound')
      .then((factory) =>
        factory.deploy(signers[0].address, _uriPrefix, _uriSuffix)
      )
    phaseThreeAvatar = await ethers
      .getContractFactory('PhaseThreeAvatar')
      .then((factory) =>
        factory.deploy(
          controller.address,
          phaseTwoSoulBound.getAddress(),
          _maxSupply,
          _royaltyFee,
          _linkAddress,
          _wrapperAddress,
          _callbackGasLimit,
          _requestConfirmations
        )
      )
  })

  describe('mintBySoulboundHolder', function () {
    it('should not be able to transfer tokens from one address to another', async function () {
      // Mint some tokens to the owner
      await phaseTwoSoulBound.mintGiveawayTokens(signers[0].address, 1)

      // Mint avatar token with soulbound token to the owner
      await phaseThreeAvatar.connect(signers[0]).mintBySoulboundHolder(0)
    })
  })

  describe('get random seed', () => {
    it('should set the randomSeedMetadata correctly', async () => {
      const linkBalance = await IERC20__factory.connect(
        _linkAddress,
        signers[0]
      ).balanceOf(signers[1].address)

      await IERC20__factory.connect(_linkAddress, signers[1]).transfer(
        signers[0].address,
        linkBalance
      )

      await IERC20__factory.connect(_linkAddress, signers[0]).approve(
        await phaseThreeAvatar.getAddress(),
        linkBalance
      )

      await phaseThreeAvatar.connect(signers[0]).requestRandomWords()
    })
  })
})