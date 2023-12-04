// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "erc721a/contracts/extensions/ERC721AQueryable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

error ExceedMaxTokens();
error TokenNotExist();
error TokenIsSoulbound();
error InvalidInput();

contract PhaseTwoSoulBound is ERC721AQueryable, Ownable {
    using Strings for uint256;

    /*///////////////////////////////////////////////////////////////
                         State Variables V1
    //////////////////////////////////////////////////////////////*/

    /// @dev address that can give away tokens
    address public mintRole;
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

    constructor(address _mintRole, string memory _uriPrefix, string memory _uriSuffix)
        ERC721A("PhaseTwoSoulBound", "PTSB")
        Ownable(msg.sender)
    {
        mintRole = _mintRole;
        uriPrefix = _uriPrefix;
        uriSuffix = _uriSuffix;
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
    function supportsInterface(bytes4 _interfaceId) public view virtual override(IERC721A, ERC721A) returns (bool) {
        // Supports the following `interfaceId`s:
        // - IERC165: 0x01ffc9a7
        // - IERC721: 0x80ac58cd
        // - IERC721Metadata: 0x5b5e139f
        return ERC721A.supportsInterface(_interfaceId);
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
    function _beforeTokenTransfers(address _from, address, /*_to*/ uint256, /*_startTokenId*/ uint256 /*_quantity*/ )
        internal
        pure
        override
    {
        // Revert if transfers are not from the 0 address and not to the 0 address
        if (_from != address(0)) {
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
    function mintGiveawayTokens(address _to, uint256 _quantity) external onlyMintRole {
        _safeMint(_to, _quantity);
        emit MintTokens(_to, _quantity, totalSupply());
    }

    /*///////////////////////////////////////////////////////////////
                        Admin Parameters Functions
    //////////////////////////////////////////////////////////////*/

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
