// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract PhaseOneFreeMint is Ownable, ERC1155 {
    using Strings for uint256;

    constructor(string memory _uriPrefix, string memory _uriSuffix) ERC1155(_uriPrefix) Ownable(msg.sender) {
        uriPrefix = _uriPrefix;
        uriSuffix = _uriSuffix;
    }

    /*///////////////////////////////////////////////////////////////
                         State Variables
    //////////////////////////////////////////////////////////////*/

    /// @dev uri parameters of the tokenURI of the ERC721 tokenss
    string public uriPrefix;
    string public uriSuffix;

    /*///////////////////////////////////////////////////////////////
                                Events
    //////////////////////////////////////////////////////////////*/

    event URISet(string uriPrefix, string uriSuffix);

    function airdropInPair(uint256 _tokenId0, uint256 _tokenId1, address _receiver) external onlyOwner {
        _airdrop(_tokenId0, _receiver);
        _airdrop(_tokenId1, _receiver);
    }

    function _airdrop(uint256 _tokenId, address _receiver) internal {
        _mint(_receiver, _tokenId, 1, "");
    }

    function merge(uint256 _tokenId0, uint256 _tokenId1) external {
        _burn(msg.sender, _tokenId0, 1);
        _burn(msg.sender, _tokenId1, 1);

        if (_tokenId0 == 0 && _tokenId1 == 5) {
            _mint(msg.sender, 10, 1, "");
        } else if (_tokenId0 == 1 && _tokenId1 == 6) {
            _mint(msg.sender, 11, 1, "");
        } else if (_tokenId0 == 2 && _tokenId1 == 7) {
            _mint(msg.sender, 12, 1, "");
        } else if (_tokenId0 == 3 && _tokenId1 == 8) {
            _mint(msg.sender, 13, 1, "");
        } else if (_tokenId0 == 4 && _tokenId1 == 9) {
            _mint(msg.sender, 14, 1, "");
        } else {
            revert("Invalid pair");
        }
    }

    /**
     * @dev Retrieve token URI to get the metadata of a token
     * @param _tokenId TokenId which caller wants to get the metadata of
     */
    function uri(uint256 _tokenId) public view override returns (string memory _tokenURI) {
        return string(abi.encodePacked(uriPrefix, _tokenId.toString(), uriSuffix));
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