// SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.6;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ERC721Checkpointable } from "./ERC721Checkpointable.sol";
import { ERC721 } from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MyNftToken is Ownable, ERC721Checkpointable {
    using Counters for Counters.Counter;

    // The internal token ID tracker
    Counters.Counter private _tokenIdCounter;

    constructor() ERC721("My NFT Token", "MNFT") {}

    function safeMint(address to) public onlyOwner {
        _safeMint(to, _tokenIdCounter.current());
        _tokenIdCounter.increment();
    }
}
