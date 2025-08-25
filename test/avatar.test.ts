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
  let mintRole: SignerWithAddress
  let signer: SignerWithAddress
  let treasury: SignerWithAddress
  let phaseThreeAvatar: PhaseThreeAvatar

  const _randomSeedHash: string = ''
  const _randomAlgoHash: string = ''

  const _maxSupply: number = 10000
  const _royaltyFee: number = 1000
  const _linkAddress: string = '0x779877A7B0D9E8603169DdbD7836e478b4624789'
  const _wrapperAddress: string = '0xab18414CD93297B0d12ac29E63Ca20f515b3DB46'
  const _callbackGasLimit: number = 100_000
  const _requestConfirmations: number = 3

  beforeEach(async () => {
    signers = await ethers.getSigners()
    mintRole = signers[0]
    signer = signers[1]
    treasury = signers[2]
    phaseThreeAvatar = await ethers
      .getContractFactory('PhaseThreeAvatar')
      .then((factory) =>
        factory.deploy(
          treasury.address,
          mintRole.address,
          signer.address,
          _maxSupply,
          _royaltyFee,
          _linkAddress,
          _wrapperAddress,
          _callbackGasLimit,
          _requestConfirmations,
          _randomSeedHash,
          _randomAlgoHash
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

  describe("Token Id", function () {
    it("should be owner of token 1 instead of 0", async function () {
        await phaseThreeAvatar.connect(signers[0]).setMintPrice(ethers.parseEther("0.1"));
        await phaseThreeAvatar.connect(signers[0]).setPublicStartMintTime(await time.latest());
        let totalTokens = await phaseThreeAvatar.totalSupply();
        expect(totalTokens).to.be.equal('0');
        await phaseThreeAvatar.connect(signers[0]).mintByAllUser({value: ethers.parseEther("0.1")});
        totalTokens = await phaseThreeAvatar.totalSupply();
        expect(totalTokens).to.be.equal('1');
        const owner = await phaseThreeAvatar.ownerOf(1);
        expect(owner).to.be.equal(signers[0].address);
    })
  })

  describe("Signature", function () {
    it("should fail if price hasn't set", async function () {
      const sign = await genSign(signers[1], signers[1].address, 1);
      await expect(phaseThreeAvatar.connect(signers[1]).mintBySoulboundHolder(1, sign, {value: ethers.parseEther("0.1")})).to.be.revertedWithCustomError(phaseThreeAvatar,"InvalidInput");
    })

    it("should fail if time hasn't set", async function () {
      await phaseThreeAvatar.connect(signers[0]).setMintPrice(ethers.parseEther("0.1"));
      const sign = await genSign(signers[1], signers[1].address, 1);
      await expect(phaseThreeAvatar.connect(signers[1]).mintBySoulboundHolder(1, sign, {value: ethers.parseEther("0.1")})).to.be.revertedWithCustomError(phaseThreeAvatar,"InvalidTimestamp");
    })

    it("should fail if signature is invalid", async function () {
        await phaseThreeAvatar.connect(signers[0]).setMintPrice(ethers.parseEther("0.1"));
        await phaseThreeAvatar.connect(signers[0]).setSoulboundStartMintTime(await time.latest());
        const sign = await genSign(signers[0], signers[1].address, 2);
        await expect(phaseThreeAvatar.connect(signers[1]).mintBySoulboundHolder(1, sign, {value: ethers.parseEther("0.1")})).to.be.revertedWithCustomError(phaseThreeAvatar,"InvalidSignature");
    })

    it("should success", async function () {
        await phaseThreeAvatar.connect(signers[0]).setMintPrice(ethers.parseEther("0.1"));
        await phaseThreeAvatar.connect(signers[0]).setSoulboundStartMintTime(await time.latest());
        let totalTokens = await phaseThreeAvatar.totalSupply();
        expect(totalTokens).to.be.equal('0');
        const sign = await genSign(signers[1], signers[1].address, 1);
        await phaseThreeAvatar.connect(signers[1]).mintBySoulboundHolder(1, sign, {value: ethers.parseEther("0.1")});  
        totalTokens = await phaseThreeAvatar.totalSupply();
        expect(totalTokens).to.be.equal('1');
    })

    it("should fail if passed soul bound end mint time", async function () {
        const curTime = await time.latest();
        await phaseThreeAvatar.connect(signers[0]).setMintPrice(ethers.parseEther("0.1"));
        await phaseThreeAvatar.connect(signers[0]).setSoulboundStartMintTime(curTime);
        await phaseThreeAvatar.connect(signers[0]).setSoulboundEndMintTime(curTime + 86400);
        let totalTokens = await phaseThreeAvatar.totalSupply();
        expect(totalTokens).to.be.equal('0');
        const sign = await genSign(signers[1], signers[1].address, 1);
        await phaseThreeAvatar.connect(signers[1]).mintBySoulboundHolder(1, sign, {value: ethers.parseEther("0.1")});  
        totalTokens = await phaseThreeAvatar.totalSupply();
        expect(totalTokens).to.be.equal('1');
        await time.increase(86400);
        await expect(phaseThreeAvatar.connect(signers[1]).mintBySoulboundHolder(1, sign, {value: ethers.parseEther("0.1")})).to.be.revertedWithCustomError(phaseThreeAvatar,"InvalidTimestamp");
        await phaseThreeAvatar.connect(signers[0]).setSoulboundEndMintTime(curTime + 86400 * 2);
        await phaseThreeAvatar.connect(signers[1]).mintBySoulboundHolder(1, sign, {value: ethers.parseEther("0.1")});
        totalTokens = await phaseThreeAvatar.totalSupply();
        expect(totalTokens).to.be.equal('2');
    })
  })

  describe("Set Random Algo IPFS Link", function () {
    it("should fail if not owner", async function () {
        await expect(phaseThreeAvatar.connect(signers[1]).setRandomAlgoIPFSLink("test")).to.be.revertedWith("Only callable by owner");
    })

    it("should success", async function () {
        await phaseThreeAvatar.connect(signers[0]).setRandomAlgoIPFSLink("test");
        const link = await phaseThreeAvatar.randomAlgoIPFSLink();
        expect(link).to.be.equal("test");
    })
  })

  describe("Public Mint", function () {
    it("should fail if price hasn't set", async function () {
        await expect(phaseThreeAvatar.connect(signers[0]).mintByAllUser({value: ethers.parseEther("0.1")})).to.be.revertedWithCustomError(phaseThreeAvatar,"InvalidInput");
    })

    it("should fail if time hasn't set", async function () {
        await phaseThreeAvatar.connect(signers[0]).setMintPrice(ethers.parseEther("0.1"));
        await expect(phaseThreeAvatar.connect(signers[0]).mintByAllUser({value: ethers.parseEther("0.1")})).to.be.revertedWithCustomError(phaseThreeAvatar,"InvalidTimestamp");
    })

    it("should success", async function () {
        await phaseThreeAvatar.connect(signers[0]).setMintPrice(ethers.parseEther("0.1"));
        await phaseThreeAvatar.connect(signers[0]).setPublicStartMintTime(await time.latest());
        let totalTokens = await phaseThreeAvatar.totalSupply();
        expect(totalTokens).to.be.equal('0');
        await phaseThreeAvatar.connect(signers[0]).mintByAllUser({value: ethers.parseEther("0.1")});
        totalTokens = await phaseThreeAvatar.totalSupply();
        expect(totalTokens).to.be.equal('1');
    })

    it("should fail if public mint is paused", async function () {
        await phaseThreeAvatar.connect(signers[0]).setMintPrice(ethers.parseEther("0.1"));
        await phaseThreeAvatar.connect(signers[0]).setPublicStartMintTime(await time.latest());
        await phaseThreeAvatar.connect(signers[0]).pause();
        await expect(phaseThreeAvatar.connect(signers[0]).mintByAllUser({value: ethers.parseEther("0.1")})).to.be.revertedWith("Pausable: paused");
    })
  })

  describe("Withdraw", function () {
    it("should fail if not owner", async function () {
        await expect(phaseThreeAvatar.connect(signers[1]).withdraw(ethers.parseEther("0.1"))).to.be.revertedWith("Only callable by owner");
    })

    it("should success", async function () {
        const balanceBefore = await ethers.provider.getBalance(treasury.address);
        /* Buy 1 token */
        await phaseThreeAvatar.connect(signers[0]).setPublicStartMintTime(await time.latest());
        await phaseThreeAvatar.connect(signers[0]).setMintPrice(ethers.parseEther("0.1"));
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
