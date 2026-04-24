// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MembershipNFT is ERC721, Ownable, ReentrancyGuard {

    uint256 public tokenIdCounter;
    uint256 public totalMembers;

    mapping(address => bool) public hasNFT;

    event MemberMinted(address indexed user, uint256 tokenId);

    constructor() ERC721("DAOsubp Membership", "DSPM") Ownable(msg.sender) {}

    function mint(address to) external onlyOwner nonReentrant {
        //Checagem
        require(to != address(0), "Invalid address");
        require(!hasNFT[to], "Already has NFT");

        // Efeitos (ANTES da interação externa)
        hasNFT[to] = true;
        tokenIdCounter++;
        uint256 newTokenId = tokenIdCounter;
        totalMembers++;

        // Interações (por último)
        _safeMint(to, newTokenId);

        emit MemberMinted(to, newTokenId);
    }
}
