// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MembershipNFT is ERC721, Ownable {

    uint256 public tokenIdCounter;
    uint256 public totalMembers;
    mapping(address => bool) public hasNFT;
    event MemberMinted(address indexed user);

    constructor() ERC721("DAOsubp Membership", "DSPM") Ownable(msg.sender) {}

    function mint(address to) external onlyOwner {
        require(!hasNFT[to], "Already has NFT");

        tokenIdCounter++;
        _safeMint(to, tokenIdCounter);
        hasNFT[to] = true;
         totalMembers++;
    }
    
}
