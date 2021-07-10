//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "hardhat/console.sol";

contract Counter is Ownable, ReentrancyGuard {
    uint256 counter;

    constructor(uint value) {
        counter = value;
        console.log("Counter initial value set to ", value);
    }

    function add(uint256 value) public nonReentrant {
        counter += value;
    }
}
