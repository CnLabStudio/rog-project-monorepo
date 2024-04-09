import { ethers } from 'hardhat'
import { expect } from 'chai'
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { IERC20__factory, PhaseTwoSoulBound } from '../build/typechain'
import { PhaseThreeAvatar } from '../build/typechain'
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'

async function genSign(signer: any, address: string, tokenId: number) {
  const messageHash = ethers.solidityPackedKeccak256([ "address", "uint256" ], [ address, tokenId ]);
  const signature = await signer.signMessage(ethers.toBeArray(messageHash));
  return signature
}

describe('PhaseThreeAvatar', () => {
  let signers: SignerWithAddress[]
  let controller: SignerWithAddress
  let signer: SignerWithAddress
  let treasury: SignerWithAddress
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
    signer = signers[1]
    treasury = signers[2]
    phaseThreeAvatar = await ethers
      .getContractFactory('PhaseThreeAvatar')
      .then((factory) =>
        factory.deploy(
          treasury.address,
          controller.address,
          signer.address,
          _maxSupply,
          _royaltyFee,
          _linkAddress,
          _wrapperAddress,
          _callbackGasLimit,
          _requestConfirmations,
          '',
          ''
        )
      )
  })

  describe('Get Random Seed', () => {
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

  describe("Signature", function () {
    it("should fail if time hasn't set", async function () {
        const sign = await genSign(signers[1], signers[1].address, 1);
        await expect(phaseThreeAvatar.connect(signers[1]).mintBySoulboundHolder(1, sign)).to.be.revertedWithCustomError(phaseThreeAvatar,"InvalidTimestamp");
    })

    it("should fail if signature is invalid", async function () {
        await phaseThreeAvatar.connect(signers[0]).setSoulboundMintTime(await time.latest());
        const sign = await genSign(signers[0], signers[1].address, 2);
        await expect(phaseThreeAvatar.connect(signers[1]).mintBySoulboundHolder(1, sign)).to.be.revertedWithCustomError(phaseThreeAvatar,"InvalidSignature");
    })

    it("should success", async function () {
        await phaseThreeAvatar.connect(signers[0]).setSoulboundMintTime(await time.latest());
        let totalTokens = await phaseThreeAvatar.totalSupply();
        expect(totalTokens).to.be.equal('0');
        const sign = await genSign(signers[1], signers[1].address, 1);
        await phaseThreeAvatar.connect(signers[1]).mintBySoulboundHolder(1, sign);  
        totalTokens = await phaseThreeAvatar.totalSupply();
        expect(totalTokens).to.be.equal('1');
    })
  })

  describe("Public Mint", function () {
    it("should fail if time hasn't set", async function () {
        await expect(phaseThreeAvatar.connect(signers[0]).mintByAllUser()).to.be.revertedWithCustomError(phaseThreeAvatar,"InvalidTimestamp");
    })

    it("should fail if value hasn't set", async function () {
        await phaseThreeAvatar.connect(signers[0]).setPublicMintTime(await time.latest());
        await expect(phaseThreeAvatar.connect(signers[0]).mintByAllUser({value: ethers.parseEther("0.1")})).to.be.revertedWithCustomError(phaseThreeAvatar,"InvalidInput");
    })

    it("should success", async function () {
        let totalTokens = await phaseThreeAvatar.totalSupply();
        expect(totalTokens).to.be.equal('0');
        await phaseThreeAvatar.connect(signers[0]).setPublicMintTime(await time.latest());
        await phaseThreeAvatar.connect(signers[0]).setPublicMintPrice(ethers.parseEther("0.1"));
        await phaseThreeAvatar.connect(signers[0]).mintByAllUser({value: ethers.parseEther("0.1")});
        totalTokens = await phaseThreeAvatar.totalSupply();
        expect(totalTokens).to.be.equal('1');
    })
  })

  describe("Withdraw", function () {
    it("should fail if not owner", async function () {
        await expect(phaseThreeAvatar.connect(signers[1]).withdraw(ethers.parseEther("0.1"))).to.be.revertedWith("Only callable by owner");
    })

    it("should success", async function () {
        const balanceBefore = await ethers.provider.getBalance(treasury.address);
        /* Buy 1 token */
        await phaseThreeAvatar.connect(signers[0]).setPublicMintTime(await time.latest());
        await phaseThreeAvatar.connect(signers[0]).setPublicMintPrice(ethers.parseEther("0.1"));
        await phaseThreeAvatar.connect(signers[0]).mintByAllUser({value: ethers.parseEther("0.1")});
        await phaseThreeAvatar.connect(signers[0]).withdraw(ethers.parseEther("0.1"));
        const balanceAfter = await ethers.provider.getBalance(treasury.address);
        const balanceDiff = balanceAfter - balanceBefore;
        expect(balanceDiff).to.be.equal(BigInt(ethers.parseEther("0.1")));
    })
  })

  describe('Airdrop', () => {
    it('should fail if not owner', async () => {
      await expect(
        phaseThreeAvatar.connect(signers[1]).mintGiveawayTokens(signers[1].address, 1)
      ).to.be.revertedWith('Caller is not the mint role')
    })
    it('should success', async () => {
      let totalTokens = await phaseThreeAvatar.totalSupply()
      expect(totalTokens).to.be.equal('0')
      await phaseThreeAvatar.connect(signers[0]).mintGiveawayTokens(signers[1].address, 1)
      totalTokens = await phaseThreeAvatar.totalSupply()
      expect(totalTokens).to.be.equal('1')
    })
  })
})
