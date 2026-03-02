// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice 利用権NFT（最小実装）。ミント権限はオペレータ（通常はバックエンド）に委譲する。
contract AccessPassNFT is ERC721, Ownable {
    address public operator;
    uint256 public nextTokenId = 1;

    error NotOperator();
    error ZeroAddress();

    event OperatorUpdated(address indexed operator);

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) Ownable(msg.sender) {}

    function setOperator(address operator_) external onlyOwner {
        if (operator_ == address(0)) revert ZeroAddress();
        operator = operator_;
        emit OperatorUpdated(operator_);
    }

    function mint(address to) external returns (uint256 tokenId) {
        if (msg.sender != operator) revert NotOperator();
        tokenId = nextTokenId++;
        _safeMint(to, tokenId);
    }
}
