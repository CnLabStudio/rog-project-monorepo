// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "erc721a/contracts/extensions/ERC721AQueryable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

contract PhaseThreeAvatar is ERC721AQueryable, ERC2981, ConfirmedOwner, Pausable {
    using Address for address payable;
    using Strings for uint256;

    /*///////////////////////////////////////////////////////////////
                         State Variables
    //////////////////////////////////////////////////////////////*/

    /// @dev address that can give away tokens
    address public mintRole;
    address public signer;
    address public treasury;
    uint256 public soulboundStartMintTime = type(uint256).max;
    uint256 public soulboundEndMintTime = type(uint256).max;
    uint256 public publicStartMintTime = type(uint256).max;
    uint256 public mintPrice = type(uint256).max;

    /// @dev maximum supply of the ERC721A tokens
    uint64 public maxSupply;
    string public randomSeedHash;
    string public randomAlgoHash;
    string public randomAlgoIPFSLink;
    /// @dev uri parameters of the tokenURI of the ERC721 tokenss
    string public uriPrefix;
    string public uriSuffix;

    /// @dev avatar token id => soulbound token id
    mapping(uint256 => uint256) public avatarToSoulbound;
    mapping(uint256 => uint256) public soulboundToAvatar;

    /// @dev Backend random number related settings
    bool public revealed;
    uint256 public randomSeedMetadata;

    /*///////////////////////////////////////////////////////////////
                            Events or Errors
    //////////////////////////////////////////////////////////////*/

    error InvalidAddressZero();
    error ExceedMaxTokens();
    error TokenNotExist();
    error Revealed();
    error NotRevealed();
    error InvalidInput();
    error InvalidTimestamp();
    error InvalidSignature();
    error SoulboundTokenAlreadyMinted();

    event MintTokens(address to, uint256 quantity, uint256 totalSupply);
    event URISet(string uriPrefix, string uriSuffix);
    event ParametersSet(string parameter, uint256 value);
    event AddressSet(string parameter, address value);

    event RandomSeedSet(uint256 randomSeed);

    /*///////////////////////////////////////////////////////////////
                            Constructor
    //////////////////////////////////////////////////////////////*/

    constructor(
        address _treasury,
        address _mintRole,
        address _signer,
        uint64 _maxSupply,
        uint96 _royaltyFee,
        string memory _randomSeedHash,
        string memory _randomAlgoHash
    )
        ERC721A("PhaseThreeAvatar", "PTA")
        ConfirmedOwner(msg.sender)
    {
        if (_treasury == address(0) || _mintRole == address(0) || _signer == address(0)) revert InvalidAddressZero();

        maxSupply = _maxSupply;
        treasury = _treasury;
        mintRole = _mintRole;
        signer = _signer;
        randomSeedHash = _randomSeedHash;
        randomAlgoHash = _randomAlgoHash;

        _setDefaultRoyalty(_treasury, _royaltyFee);
    }

    /*///////////////////////////////////////////////////////////////
                            Modifiers
    //////////////////////////////////////////////////////////////*/

    modifier onlyMintRole() {
        require(msg.sender == mintRole, "Caller is not the mint role");
        _;
    }

    /*///////////////////////////////////////////////////////////////
                        External Functions
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Override same interface function in different inheritance.
     * @param _interfaceId Id of an interface to check whether the contract support
     */
    function supportsInterface(bytes4 _interfaceId)
        public
        view
        virtual
        override(IERC721A, ERC721A, ERC2981)
        returns (bool)
    {
        // Supports the following `interfaceId`s:
        // - IERC165: 0x01ffc9a7
        // - IERC721: 0x80ac58cd
        // - IERC721Metadata: 0x5b5e139f
        // - IERC2981: 0x2a55205a
        return ERC721A.supportsInterface(_interfaceId) || ERC2981.supportsInterface(_interfaceId);
    }

    /**
     * @dev Retrieve token URI to get the metadata of a token
     * @param _tokenId TokenId which caller wants to get the metadata of
     */
    function tokenURI(uint256 _tokenId) public view override(IERC721A, ERC721A) returns (string memory _tokenURI) {
        if (!_exists(_tokenId)) revert TokenNotExist();
        if (!revealed) revert NotRevealed();

        // Derive a seed-based affine permutation over [0, maxSupply-1]
        // meta = (a * tokenIndex + b) mod N, where gcd(a, N) == 1 to ensure bijection
        uint256 N = uint256(maxSupply);
        (uint256 a, uint256 b) = _derivePermutationParams(N);

        uint256 zeroIndexedToken = _tokenId - 1;
        uint256 zeroIndexedMeta = addmod(mulmod(a, zeroIndexedToken, N), b, N);
        uint256 metadataId = zeroIndexedMeta + 1; // 1..maxSupply

        return string(abi.encodePacked(uriPrefix, metadataId.toString(), uriSuffix));
    }

    function _gcd(uint256 _x, uint256 _y) internal pure returns (uint256) {
        while (_y != 0) {
            uint256 temp = _y;
            _y = _x % _y;
            _x = temp;
        }
        return _x;
    }

    function _derivePermutationParams(uint256 _modulus) internal view returns (uint256 a, uint256 b) {
        require(_modulus > 1, "Invalid modulus");
        // Derive candidates from the seed
        bytes32 ha = keccak256(abi.encodePacked(randomSeedMetadata, "a"));
        bytes32 hb = keccak256(abi.encodePacked(randomSeedMetadata, "b"));
        a = uint256(ha) % _modulus;
        if (a == 0) a = 1;
        // Ensure a is coprime to modulus
        while (_gcd(a, _modulus) != 1) {
            a = (a + 1) % _modulus;
            if (a == 0) a = 1;
        }
        b = uint256(hb) % _modulus;
    }

    function _startTokenId() internal pure override returns (uint256) {
        return 1;
    }

    /**
     * @dev Check whether an address is in the list
     * @dev Check whether the signature generation process is abnormal
     * @param _tokenId TokenId of tokens that the address wants to verify with soulbound
     * @param _signature Signature used to verify the address is in the list
     */
    function verify(uint256 _tokenId, address _signer, bytes calldata _signature)
        public
        view
        returns (bool _whitelisted)
    {
        bytes32 hash = ECDSA.toEthSignedMessageHash(keccak256(abi.encodePacked(msg.sender, _tokenId)));
        return _signer == ECDSA.recover(hash, _signature);
    }

    /**
     * @dev Mint one token to the corresponding soulbound token holder as owner
     * @param _tokenId TokenId of the soulbound token
     * @notice This function is only available after the soulbound mint time
     * @notice This function is only available when the total supply is less than the maximum supply
     * @notice This function is only available when the soulbound token holder has not minted the token
     */
    function mintBySoulboundHolder(uint256 _tokenId, bytes calldata _signature) external payable {
        if (msg.value != mintPrice) revert InvalidInput();
        uint256 currentId = totalSupply() + 1;
        if (currentId > maxSupply) revert ExceedMaxTokens();
        if (block.timestamp < soulboundStartMintTime || block.timestamp > soulboundEndMintTime) {
            revert InvalidTimestamp();
        }
        if (!verify(_tokenId, signer, _signature)) revert InvalidSignature();
        if (soulboundToAvatar[_tokenId] != 0) revert SoulboundTokenAlreadyMinted();

        soulboundToAvatar[_tokenId] = currentId;
        avatarToSoulbound[currentId] = _tokenId;

        _safeMint(msg.sender, 1);

        emit MintTokens(msg.sender, 1, currentId);
    }

    /**
     * @dev Mint one token to the msg.sender as owner
     * @notice This function is only available after the public mint time
     * @notice This function is only available when the total supply is less than the maximum supply
     * @notice This function is only available when the msg.value is greater than the public mint price
     */
    function mintByAllUser() external payable whenNotPaused {
        if (msg.value != mintPrice) revert InvalidInput();
        if (totalSupply() + 1 > maxSupply) revert ExceedMaxTokens();
        if (block.timestamp < publicStartMintTime) revert InvalidTimestamp();

        _safeMint(msg.sender, 1);

        emit MintTokens(msg.sender, 1, totalSupply());
    }

    /*///////////////////////////////////////////////////////////////
                        Admin Operation Functions
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Mint designated amount of tokens to an address as owner
     * @param _to Address to transfer the tokens
     * @param _quantity Designated amount of tokens
     */
    function mintGiveawayTokens(address _to, uint256 _quantity) external onlyMintRole {
        if (totalSupply() + _quantity > maxSupply) revert ExceedMaxTokens();
        _safeMint(_to, _quantity);
        emit MintTokens(_to, _quantity, totalSupply());
    }

    /**
     * @dev Withdraw all the funds in the contract
     * @param _amount Amount of funds to withdraw
     */
    function withdraw(uint256 _amount) external payable onlyOwner {
        payable(treasury).sendValue(_amount);
    }

    /*///////////////////////////////////////////////////////////////
                        Admin Parameters Functions
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Pauses the functionalities with whenNotPaused as modifier.
     * @dev Only callable by the contract owner.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Resumes the functionalities with whenNotPaused as modifier.
     * @dev Only callable by the contract owner.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Set the address of the mintRole
     * @param _mintRole New address of the mintRole
     */
    function setMintRole(address _mintRole) external onlyOwner {
        if (_mintRole == address(0)) revert InvalidAddressZero();
        mintRole = _mintRole;

        emit AddressSet("mintRole", _mintRole);
    }

    /**
     * @dev Set the address of the signer
     * @param _signer New address of the signer
     */
    function setSigner(address _signer) external onlyOwner {
        if (_signer == address(0)) revert InvalidAddressZero();
        signer = _signer;

        emit AddressSet("signer", _signer);
    }

    /**
     * @dev Set the address that act as treasury and recieve all the fund from token contract.
     * @param _treasury New address that caller wants to set as the treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert InvalidAddressZero();
        treasury = _treasury;

        emit AddressSet("treasury", _treasury);
    }

    /**
     * @dev Set the time when soulbound holders can mint the tokens
     * @param _mintStartTime New time when soulbound holders can mint the tokens
     */
    function setSoulboundStartMintTime(uint256 _mintStartTime) external onlyOwner {
        soulboundStartMintTime = _mintStartTime;

        emit ParametersSet("soulboundStartMintTime", _mintStartTime);
    }

    /**
     * @dev Set the time when soulbound holders can't mint the tokens
     * @param _mintEndTime New time when soulbound holders can't mint the tokens
     */
    function setSoulboundEndMintTime(uint256 _mintEndTime) external onlyOwner {
        soulboundEndMintTime = _mintEndTime;

        emit ParametersSet("soulboundEndMintTime", _mintEndTime);
    }

    /**
     * @dev Set the time when all users can mint the tokens
     * @param _mintStartTime New time when all users can mint the tokens
     */
    function setPublicStartMintTime(uint256 _mintStartTime) external onlyOwner {
        publicStartMintTime = _mintStartTime;

        emit ParametersSet("publicStartMintTime", _mintStartTime);
    }

    /**
     * @dev Set the price of minting the tokens for all users
     * @param _mintPrice New price of minting the tokens for all users
     */
    function setMintPrice(uint256 _mintPrice) external onlyOwner {
        mintPrice = _mintPrice;

        emit ParametersSet("mintPrice", _mintPrice);
    }

    /**
     * @dev Set the maximum total supply of tokens
     * @param _maxSupply Maximum total supply of the tokens
     */
    function setMaxSupply(uint64 _maxSupply) external onlyOwner {
        if (_maxSupply < totalSupply()) revert InvalidInput();
        maxSupply = _maxSupply;

        emit ParametersSet("maxSupply", _maxSupply);
    }

    /**
     * @dev Set the URI for tokenURI, which returns the metadata of the token
     * @param _uriPrefix New URI Prefix that caller wants to set as the tokenURI
     * @param _uriSuffix New URI Suffix that caller wants to set as the tokenURI
     */
    function setURI(string memory _uriPrefix, string memory _uriSuffix) external onlyOwner {
        uriPrefix = _uriPrefix;
        uriSuffix = _uriSuffix;

        emit URISet(uriPrefix, uriSuffix);
    }

    function setRandomAlgoIPFSLink(string memory _randomAlgoIPFSLink) external onlyOwner {
        randomAlgoIPFSLink = _randomAlgoIPFSLink;
    }

    /**
     * @dev Set the royalties information for platforms that support ERC2981, LooksRare & X2Y2
     * @param _receiver Address that should receive royalties
     * @param _feeNumerator Amount of royalties that collection creator wants to receive
     */
    function setDefaultRoyalty(address _receiver, uint96 _feeNumerator) external onlyOwner {
        _setDefaultRoyalty(_receiver, _feeNumerator);
    }

    /**
     * @dev Set the royalties information for platforms that support ERC2981, LooksRare & X2Y2
     * @param _receiver Address that should receive royalties
     * @param _feeNumerator Amount of royalties that collection creator wants to receive
     */
    function setTokenRoyalty(uint256 _tokenId, address _receiver, uint96 _feeNumerator) external onlyOwner {
        _setTokenRoyalty(_tokenId, _receiver, _feeNumerator);
    }

    /*///////////////////////////////////////////////////////////////
                        Backend Random Seed Functions
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Set random seed from backend and reveal the metadata
     * @param _randomSeed The random seed generated by backend
     * @notice This function can only be called by the owner once
     */
    function setRandomSeed(uint256 _randomSeed) external onlyOwner {
        if (revealed) revert Revealed();
        
        randomSeedMetadata = _randomSeed;
        revealed = true;
        
        emit RandomSeedSet(_randomSeed);
    }

    /**
     * @dev Get the current random seed and reveal status
     * @return randomSeed The current random seed
     * @return isRevealed Whether the random seed has been revealed
     */
    function getRandomSeedStatus() external view returns (uint256 randomSeed, bool isRevealed) {
        return (randomSeedMetadata, revealed);
    }
}
