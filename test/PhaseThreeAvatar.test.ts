import { ethers } from 'hardhat'
import { expect } from 'chai'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { PhaseThreeAvatar } from '../build/typechain'
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'

function gcd(x: bigint, y: bigint): bigint {
  while (y !== 0n) {
    const t = y
    y = x % t
    x = t
  }
  return x
}

function derivePermutationParams(seed: bigint, modulus: bigint): { a: bigint; b: bigint } {
  if (modulus <= 1n) throw new Error('Invalid modulus')
  const ha = ethers.solidityPackedKeccak256(['uint256', 'string'], [seed, 'a'])
  const hb = ethers.solidityPackedKeccak256(['uint256', 'string'], [seed, 'b'])
  let a = BigInt(ha) % modulus
  if (a === 0n) a = 1n
  while (gcd(a, modulus) !== 1n) {
    a = (a + 1n) % modulus
    if (a === 0n) a = 1n
  }
  const b = BigInt(hb) % modulus
  return { a, b }
}

describe('PhaseThreeAvatar - randomSeedMetadata', () => {
  let signers: SignerWithAddress[]
  let owner: SignerWithAddress
  let mintRole: SignerWithAddress
  let signer: SignerWithAddress
  let treasury: SignerWithAddress
  let avatar: PhaseThreeAvatar

  const maxSupply = 10
  const royaltyFee = 500
  const randomSeedHash = 'seed-hash'
  const randomAlgoHash = 'algo-hash'
  const uriPrefix = 'https://example.com/meta/'
  const uriSuffix = '.json'

  beforeEach(async () => {
    signers = await ethers.getSigners()
    owner = signers[0]
    mintRole = signers[0]
    signer = signers[1]
    treasury = signers[2]

    avatar = await ethers
      .getContractFactory('PhaseThreeAvatar')
      .then((f) =>
        f.deploy(
          treasury.address,
          mintRole.address,
          signer.address,
          maxSupply,
          royaltyFee,
          randomSeedHash,
          randomAlgoHash
        )
      )

    await avatar.setURI(uriPrefix, uriSuffix)
  })

  it('should revert tokenURI before reveal', async () => {
    // Mint one token so it exists (owner has mint role)
    await avatar.mintGiveawayTokens(owner.address, 1)
    await expect(avatar.tokenURI(1)).to.be.revertedWithCustomError(avatar, 'NotRevealed')
  })

  it('should set randomSeedMetadata and mark revealed', async () => {
    const seed = 7777n
    await avatar.setRandomSeed(seed)

    const [storedSeed, isRevealed] = await avatar.getRandomSeedStatus()
    expect(storedSeed).to.equal(seed)
    expect(isRevealed).to.equal(true)
  })

  it('should not allow setting random seed twice', async () => {
    const seed = 123n
    await avatar.setRandomSeed(seed)
    await expect(avatar.setRandomSeed(456n)).to.be.revertedWithCustomError(avatar, 'Revealed')
  })

  it('tokenURI should follow seed-derived affine permutation', async () => {
    // Reveal with a deterministic seed
    const seed = 20240531n
    await avatar.setRandomSeed(seed)

    // Enable public mint and mint a few tokens
    await avatar.setMintPrice(ethers.parseEther('0.1'))
    await avatar.setPublicStartMintTime(await time.latest())

    await avatar.mintByAllUser({ value: ethers.parseEther('0.1') }) // tokenId 1
    await avatar.mintByAllUser({ value: ethers.parseEther('0.1') }) // tokenId 2
    await avatar.mintByAllUser({ value: ethers.parseEther('0.1') }) // tokenId 3

    // Compute expected mapping
    const N = BigInt(maxSupply)
    const { a, b } = derivePermutationParams(seed, N)

    const expectedUri = (tokenId: number) => {
      const zeroIndexedToken = BigInt(tokenId - 1)
      const zeroIndexedMeta = (a * zeroIndexedToken + b) % N
      const metadataId = zeroIndexedMeta + 1n
      return `${uriPrefix}${metadataId.toString()}${uriSuffix}`
    }

    expect(await avatar.tokenURI(1)).to.equal(expectedUri(1))
    expect(await avatar.tokenURI(2)).to.equal(expectedUri(2))
    expect(await avatar.tokenURI(3)).to.equal(expectedUri(3))
  })
  
  it('should only allow owner to set random seed and emit event', async () => {
    const seed = 9999n
    await expect(avatar.connect(signers[1]).setRandomSeed(seed)).to.be.revertedWith('Only callable by owner')
    await expect(avatar.setRandomSeed(seed)).to.emit(avatar, 'RandomSeedSet').withArgs(seed)
  })
  
  it('tokenURI should revert when token does not exist', async () => {
    await avatar.setRandomSeed(1n)
    await expect(avatar.tokenURI(1)).to.be.revertedWithCustomError(avatar, 'TokenNotExist')
  })
  
  it('getRandomSeedStatus returns current seed and reveal flag', async () => {
    const seed = 12345n
    await avatar.setRandomSeed(seed)
    const [storedSeed, isRevealed] = await avatar.getRandomSeedStatus()
    expect(storedSeed).to.equal(seed)
    expect(isRevealed).to.equal(true)
  })
  
  it('supports expected interfaces', async () => {
    expect(await avatar.supportsInterface('0x01ffc9a7')).to.equal(true)
    expect(await avatar.supportsInterface('0x80ac58cd')).to.equal(true)
    expect(await avatar.supportsInterface('0x5b5e139f')).to.equal(true)
    expect(await avatar.supportsInterface('0x2a55205a')).to.equal(true)
    expect(await avatar.supportsInterface('0xffffffff')).to.equal(false)
  })
  
  it('admin setters and events work', async () => {
    await expect(avatar.setURI('ipfs://meta/', '.json')).to.emit(avatar, 'URISet').withArgs('ipfs://meta/', '.json')
    await expect(avatar.setMintPrice(ethers.parseEther('0.2'))).to.emit(avatar, 'ParametersSet').withArgs('mintPrice', ethers.parseEther('0.2'))
    const now = await time.latest()
    await expect(avatar.setPublicStartMintTime(now)).to.emit(avatar, 'ParametersSet').withArgs('publicStartMintTime', now)
    await expect(avatar.setSoulboundStartMintTime(now)).to.emit(avatar, 'ParametersSet').withArgs('soulboundStartMintTime', now)
    await expect(avatar.setSoulboundEndMintTime(now + 1000)).to.emit(avatar, 'ParametersSet').withArgs('soulboundEndMintTime', now + 1000)
    await expect(avatar.setMintRole(owner.address)).to.emit(avatar, 'AddressSet').withArgs('mintRole', owner.address)
    await expect(avatar.setSigner(signer.address)).to.emit(avatar, 'AddressSet').withArgs('signer', signer.address)
    await expect(avatar.setTreasury(treasury.address)).to.emit(avatar, 'AddressSet').withArgs('treasury', treasury.address)
    await expect(avatar.setMintRole(ethers.ZeroAddress)).to.be.revertedWithCustomError(avatar, 'InvalidAddressZero')
    await expect(avatar.setSigner(ethers.ZeroAddress)).to.be.revertedWithCustomError(avatar, 'InvalidAddressZero')
    await expect(avatar.setTreasury(ethers.ZeroAddress)).to.be.revertedWithCustomError(avatar, 'InvalidAddressZero')
  })
  
  it('setMaxSupply enforces not lowering below totalSupply', async () => {
    await avatar.mintGiveawayTokens(owner.address, 2)
    await expect(avatar.setMaxSupply(1)).to.be.revertedWithCustomError(avatar, 'InvalidInput')
    await expect(avatar.setMaxSupply(20)).to.emit(avatar, 'ParametersSet').withArgs('maxSupply', 20)
  })
  
  it('royaltyInfo returns correct receiver and amount', async () => {
    // constructor sets default royalty to treasury with fee = royaltyFee
    const salePrice = 10_000n
    const [receiver, royaltyAmount] = await avatar.royaltyInfo(1, salePrice)
    expect(receiver).to.equal(treasury.address)
    expect(royaltyAmount).to.equal(BigInt(royaltyFee))
  })
  
  it('public mint flow: invalid input, invalid time, success, paused, and supply cap', async () => {
    await expect(avatar.mintByAllUser({ value: ethers.parseEther('0.1') })).to.be.revertedWithCustomError(avatar, 'InvalidInput')
    await avatar.setMintPrice(ethers.parseEther('0.1'))
    await expect(avatar.mintByAllUser({ value: ethers.parseEther('0.1') })).to.be.revertedWithCustomError(avatar, 'InvalidTimestamp')
    await avatar.setPublicStartMintTime(await time.latest())
    await avatar.mintByAllUser({ value: ethers.parseEther('0.1') })
    await avatar.pause()
    await expect(avatar.mintByAllUser({ value: ethers.parseEther('0.1') })).to.be.revertedWith('Pausable: paused')
    await avatar.unpause()
    for (let i = 0; i < maxSupply - 1; i++) {
      await avatar.mintByAllUser({ value: ethers.parseEther('0.1') })
    }
    await expect(avatar.mintByAllUser({ value: ethers.parseEther('0.1') })).to.be.revertedWithCustomError(avatar, 'ExceedMaxTokens')
  })
  
  it('soulbound mint flow: signature check, time window, mapping, and price', async () => {
    const genSign = async (signerLocal: any, addr: string, tokenId: number) => {
      const msgHash = ethers.solidityPackedKeccak256(['address', 'uint256'], [addr, tokenId])
      return signerLocal.signMessage(ethers.toBeArray(msgHash))
    }
    await expect(avatar.mintBySoulboundHolder(1, '0x', { value: ethers.parseEther('0.1') })).to.be.revertedWithCustomError(avatar, 'InvalidInput')
    await avatar.setMintPrice(ethers.parseEther('0.1'))
    await expect(avatar.mintBySoulboundHolder(1, '0x', { value: ethers.parseEther('0.1') })).to.be.revertedWithCustomError(avatar, 'InvalidTimestamp')
    const now = await time.latest()
    await avatar.setSoulboundStartMintTime(now)
    await avatar.setSoulboundEndMintTime(now + 1000)
    const goodSig = await genSign(signer, signer.address, 42)
    await expect(avatar.connect(signer).mintBySoulboundHolder(41, goodSig, { value: ethers.parseEther('0.1') })).to.be.revertedWithCustomError(avatar, 'InvalidSignature')
    await avatar.connect(signer).mintBySoulboundHolder(42, goodSig, { value: ethers.parseEther('0.1') })
    const supplyAfter = await avatar.totalSupply()
    const mintedTokenIndex = Number(supplyAfter) // after mint, totalSupply equals last tokenId minted since start is 1
    const mapped = await avatar.avatarToSoulbound(mintedTokenIndex - 1)
    expect(mapped).to.equal(42)
    await time.increase(2000)
    await expect(avatar.connect(signer).mintBySoulboundHolder(43, await genSign(signer, signer.address, 43), { value: ethers.parseEther('0.1') })).to.be.revertedWithCustomError(avatar, 'InvalidTimestamp')
  })
  
  it('only mint role can airdrop and cannot exceed max supply', async () => {
    await expect(avatar.connect(signer).mintGiveawayTokens(owner.address, 1)).to.be.revertedWith('Caller is not the mint role')
    await avatar.mintGiveawayTokens(owner.address, maxSupply)
    await expect(avatar.mintGiveawayTokens(owner.address, 1)).to.be.revertedWithCustomError(avatar, 'ExceedMaxTokens')
  })
  
  it('withdraw sends funds to treasury and only owner can call', async () => {
    await expect(avatar.connect(signer).withdraw(ethers.parseEther('0.1'))).to.be.revertedWith('Only callable by owner')
    await avatar.setMintPrice(ethers.parseEther('1'))
    await avatar.setPublicStartMintTime(await time.latest())
    await avatar.mintByAllUser({ value: ethers.parseEther('1') })
    const before = await ethers.provider.getBalance(treasury.address)
    await avatar.withdraw(ethers.parseEther('1'))
    const after = await ethers.provider.getBalance(treasury.address)
    expect(after - before).to.equal(ethers.parseEther('1'))
  })
})


