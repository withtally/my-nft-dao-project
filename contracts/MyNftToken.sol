// SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.6;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import { MetadataBuilder } from "./MetadataBuilder.sol";

contract MyNftToken is Ownable, ERC721 {
    using Counters for Counters.Counter;

    string[] internal nouns = ["dog", "cat", "fish", "lion", "bird", "snake"];
    string[] internal adjectives = ["grump", "happy", "intrigued", "sad", "excited"];

    // The internal token ID tracker
    Counters.Counter private _tokenIdCounter;

    constructor() ERC721("My NFT Token", "MNFT") {}

    function safeMint(address to) public onlyOwner {
        _safeMint(to, _tokenIdCounter.current());
        _tokenIdCounter.increment();
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        string memory noun = nouns[tokenId % nouns.length];
        string memory adjective = adjectives[tokenId % adjectives.length];
        return MetadataBuilder.tokenURI(noun, adjective, "red", "black");
    }
}
