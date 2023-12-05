// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "hardhat/console.sol";

import "erc721a/contracts/extensions/ERC721AQueryable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFV2WrapperConsumerBase.sol";

error ExceedMaxTokens();
error TokenNotExist();
error Revealed();
error InvalidInput();
error InvalidTimestamp();

contract PhaseThreeAvatar is ERC721AQueryable, ERC2981, VRFV2WrapperConsumerBase, ConfirmedOwner {
    using Strings for uint256;

    struct RequestStatus {
        uint256 paid;
        bool fulfilled;
        uint256[] randomWords;
    }

    struct RequestConfig {
        uint32 callbackGasLimit;
        uint16 requestConfirmations;
        uint32 numWords;
    }

    /*///////////////////////////////////////////////////////////////
                         State Variables V1
    //////////////////////////////////////////////////////////////*/

    address public soulboundAddress;
    uint256 public soulboundMintTime;
    uint256 public publicMintTime;
    uint256 public publicMintPrice;

    /// @dev maximum supply of the ERC721A tokens
    uint256 public maxSupply;
    string public randomAlgoHash;
    string public randomAlgoIPFSHash;
    /// @dev uri parameters of the tokenURI of the ERC721 tokenss
    string public uriPrefix;
    string public uriSuffix;

    /// @dev soulbound token holder => soulbound token id => whether the soulbound token holder has minted the token
    mapping(address => mapping(uint256 => bool)) public soulboundMinted;
    /// @dev avatar token id => soulbound token id
    mapping(uint256 => uint256) public avatarToSoulbound;

    /// @dev Chainlink VRF related settings
    bool public revealed;
    uint256 public requestId;
    RequestStatus public requestStatus;
    uint256 public randomSeedMetadata;
    IERC20 public linkTokenContract;
    VRFV2WrapperInterface public vrfWrapper;
    RequestConfig public requestConfig;

    /*///////////////////////////////////////////////////////////////
                                Events
    //////////////////////////////////////////////////////////////*/

    event MintTokens(address to, uint256 quantity, uint256 totalSupply);
    event URISet(string uriPrefix, string uriSuffix);
    event ParametersSet(string parameter, uint256 value);
    event AddressSet(string parameter, address value);

    event RequestSent(uint256 requestId, uint32 numWords);
    event RequestFulfilled(uint256 requestId, uint256[] randomWords, uint256 payment);

    /*///////////////////////////////////////////////////////////////
                            Constructor
    //////////////////////////////////////////////////////////////*/

    constructor(
        address _treasury,
        address _soulbound,
        uint256 _maxSupply,
        uint96 _royaltyFee,
        address _linkAddress,
        address _wrapperAddress,
        uint32 _callbackGasLimit,
        uint16 _requestConfirmations,
        string memory _randomAlgoHash,
        string memory _randomAlgoIPFSHash
    )
        ERC721A("PhaseThreeAvatar", "PTA")
        ConfirmedOwner(msg.sender)
        VRFV2WrapperConsumerBase(_linkAddress, _wrapperAddress)
    {
        require(_linkAddress != address(0), "Link Token address cannot be 0x0");
        require(_wrapperAddress != address(0), "Wrapper address cannot be 0x0");

        maxSupply = _maxSupply;
        vrfWrapper = VRFV2WrapperInterface(_wrapperAddress);
        linkTokenContract = IERC20(_linkAddress);
        requestConfig = RequestConfig({
            callbackGasLimit: _callbackGasLimit,
            requestConfirmations: _requestConfirmations,
            numWords: 1
        });

        soulboundAddress = _soulbound;
        randomAlgoHash = _randomAlgoHash;
        randomAlgoIPFSHash = _randomAlgoIPFSHash;

        _setDefaultRoyalty(_treasury, _royaltyFee);
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
        if (!_exists(_tokenId)) {
            revert TokenNotExist();
        }

        return string(abi.encodePacked(uriPrefix, _tokenId.toString(), uriSuffix));
    }

    /*///////////////////////////////////////////////////////////////
                        Admin Operation Functions
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Mint designated amount of tokens to an address as owner
     * @param _to Address to transfer the tokens
     * @param _quantity Designated amount of tokens
     */
    function mintGiveawayTokens(address _to, uint256 _quantity) external onlyOwner {
        if (totalSupply() + _quantity > maxSupply) {
            revert ExceedMaxTokens();
        }

        _safeMint(_to, _quantity);
        emit MintTokens(_to, _quantity, totalSupply());
    }

    /**
     * @dev Mint one token to the corresponding soulbound token holder as owner
     * @param _tokenId TokenId of the soulbound token
     * @notice This function is only available after the soulbound mint time
     * @notice This function is only available when the total supply is less than the maximum supply
     * @notice This function is only available when the soulbound token holder has not minted the token
     */
    function mintBySoulboundHolder(uint256 _tokenId) external {
        if (totalSupply() + 1 > maxSupply) {
            revert ExceedMaxTokens();
        }
        if (block.timestamp < soulboundMintTime) {
            revert InvalidTimestamp();
        }
        if (soulboundMinted[msg.sender][_tokenId]) {
            revert InvalidInput();
        }
        if (IERC721(soulboundAddress).ownerOf(_tokenId) != msg.sender) {
            revert InvalidInput();
        }

        soulboundMinted[msg.sender][_tokenId] = true;
        avatarToSoulbound[totalSupply()] = _tokenId;

        _safeMint(msg.sender, 1);

        emit MintTokens(msg.sender, 1, totalSupply());
    }

    /**
     * @dev Mint one token to the msg.sender as owner
     * @notice This function is only available after the public mint time
     * @notice This function is only available when the total supply is less than the maximum supply
     * @notice This function is only available when the msg.value is greater than the public mint price
     */
    function mintByAllUser() external payable {
        if (totalSupply() + 1 > maxSupply) {
            revert ExceedMaxTokens();
        }
        if (block.timestamp < publicMintTime) {
            revert InvalidTimestamp();
        }
        if (msg.value < publicMintPrice) {
            revert InvalidInput();
        }

        _safeMint(msg.sender, 1);

        emit MintTokens(msg.sender, 1, totalSupply());
    }

    /*///////////////////////////////////////////////////////////////
                        Admin Parameters Functions
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Set the address of the soulbound token contract
     * @param _soulBound New address of the soulbound token contract
     */
    function setSoulboundAddress(address _soulBound) external onlyOwner {
        soulboundAddress = _soulBound;

        emit AddressSet("soulboundAddress", _soulBound);
    }

    /**
     * @dev Set the time when soulbound holders can mint the tokens
     * @param _mintTime New time when soulbound holders can mint the tokens
     */
    function setSoulboundMintTime(uint256 _mintTime) external onlyOwner {
        soulboundMintTime = _mintTime;

        emit ParametersSet("soulboundMintTime", _mintTime);
    }

    /**
     * @dev Set the time when all users can mint the tokens
     * @param _mintTime New time when all users can mint the tokens
     */
    function setPublicMintTime(uint256 _mintTime) external onlyOwner {
        publicMintTime = _mintTime;

        emit ParametersSet("publicMintTime", _mintTime);
    }

    /**
     * @dev Set the price of minting the tokens for all users
     * @param _mintPrice New price of minting the tokens for all users
     */
    function setPublicMintPrice(uint256 _mintPrice) external onlyOwner {
        publicMintPrice = _mintPrice;

        emit ParametersSet("publicMintPrice", _mintPrice);
    }

    /**
     * @dev Set the maximum total supply of tokens
     * @param _maxSupply Maximum total supply of the tokens
     */
    function setMaxSupply(uint256 _maxSupply) external onlyOwner {
        if (_maxSupply < totalSupply()) {
            revert InvalidInput();
        }

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
                        Chainlink VRF Functions
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Sends a VRF request and transfers the cost of the request to the contract
     * @return requestId The ID of the VRF request
     */
    function requestRandomWords() external onlyOwner returns (uint256 /*requestId*/ ) {
        if (revealed) {
            revert Revealed();
        }
        // Calculate the amount of LINK to send with the request
        uint256 requestPrice = vrfWrapper.calculateRequestPrice(requestConfig.callbackGasLimit);
        // Transfer the LINK to the VRF Wrapper contract
        // The VRF Wrapper contract will transfer the LINK to the VRF Coordinator
        require(linkTokenContract.transferFrom(msg.sender, address(this), requestPrice), "Not enough LINK");
        // Send the request to the VRF Wrapper contract
        requestId = requestRandomness(
            requestConfig.callbackGasLimit, requestConfig.requestConfirmations, requestConfig.numWords
        );
        // Update the request status in the mapping
        requestStatus = RequestStatus({paid: requestPrice, randomWords: new uint256[](0), fulfilled: false});
        emit RequestSent(requestId, requestConfig.numWords);
        return requestId;
    }

    /**
     * @dev Fulfills a VRF request by updating the request status in the mapping
     * @param _requestId The ID of the VRF request to fulfill
     * @param _randomWords The array of random words generated by the VRF request
     */
    function fulfillRandomWords(uint256 _requestId, uint256[] memory _randomWords) internal override {
        require(requestStatus.paid > 0, "request not found");
        requestStatus.fulfilled = true;
        requestStatus.randomWords = _randomWords;

        randomSeedMetadata = _randomWords[0];
        revealed = true;

        emit RequestFulfilled(_requestId, _randomWords, requestStatus.paid);
    }

    /**
     * @dev Retrieves the status of a VRF request
     * @return paid The cost of the VRF request
     * @return fulfilled Whether or not the VRF request has been fulfilled
     * @return randomWords The array of random words generated by the VRF request
     */
    function getRequestStatus() external view returns (uint256 paid, bool fulfilled, uint256[] memory randomWords) {
        require(requestStatus.paid > 0, "request not found");
        RequestStatus memory request = requestStatus;
        return (request.paid, request.fulfilled, request.randomWords);
    }
}
