// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "erc721a/contracts/extensions/ERC721AQueryable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

error ExceedMaxTokens();
error TokenNotExist();
error TokenIsSoulbound();
error InvalidInput();

contract PhaseTwoSoulBound is ERC721AQueryable, Ownable, ERC2981 {
    using Strings for uint256;

    /*///////////////////////////////////////////////////////////////
                         State Variables V1
    //////////////////////////////////////////////////////////////*/

    /// @dev maximum supply of the ERC721A tokens
    uint256 public maxSupply;

    /// @dev uri parameters of the tokenURI of the ERC721 tokenss
    string public uriPrefix;
    string public uriSuffix;

    /*///////////////////////////////////////////////////////////////
                                Events
    //////////////////////////////////////////////////////////////*/

    event MintTokens(address to, uint256 quantity, uint256 totalSupply);
    event URISet(string uriPrefix, string uriSuffix);
    event MaxSupplySet(uint256 maxTokenSupply);

    /*///////////////////////////////////////////////////////////////
                            Constructor
    //////////////////////////////////////////////////////////////*/

    constructor(
        address _treasury,
        string memory _uriPrefix,
        string memory _uriSuffix,
        uint256 _maxSupply,
        uint96 _royaltyFee
    ) ERC721A("Ideathon2023", "IDTH2023") Ownable(msg.sender) {
        uriPrefix = _uriPrefix;
        uriSuffix = _uriSuffix;
        maxSupply = _maxSupply;

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

    /**
     * @dev Enforces that tokens cannot be sent in a manner consistent with the 'Soulbound' spec.
     *
     * Requirements:
     *
     * - The `from` address must be the 0 address
     * OR
     * - The `to` address must be the 0 address
     */
    function _beforeTokenTransfers(address _from, address _to, uint256, /*_startTokenId*/ uint256 /*_quantity*/ )
        internal
        pure
        override
    {
        // Revert if transfers are not from the 0 address and not to the 0 address
        if (_from != address(0) && _to != address(0)) {
            revert TokenIsSoulbound();
        }

        return;
    }

    /*///////////////////////////////////////////////////////////////
                        Admin Operation Functions
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Mint designated amount of tokens to an address as owner
     * @param _to Address to transfer the tokens
     * @param _quantity Designated amount of tokens
     */
    function mintGiveawayTokens(address _to, uint256 _quantity) public onlyOwner {
        if (totalSupply() + _quantity > maxSupply) {
            revert ExceedMaxTokens();
        }

        _safeMint(_to, _quantity);
        emit MintTokens(_to, _quantity, totalSupply());
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

        emit MaxSupplySet(_maxSupply);
    }

    /*///////////////////////////////////////////////////////////////
                        Admin Parameters Functions
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Set the royalties information for platforms that support ERC2981, LooksRare & X2Y2
     * @param _receiver Address that should receive royalties
     * @param _feeNumerator Amount of royalties that collection creator wants to receive
     */
    function setDefaultRoyalty(address _receiver, uint96 _feeNumerator) public onlyOwner {
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
}
