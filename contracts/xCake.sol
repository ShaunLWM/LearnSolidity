//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract xCake is ERC20 {
    constructor(uint256 initialSupply) ERC20("xCake", "XCK") {
        _mint(msg.sender, initialSupply);
    }

    function transfer(address recipient, uint256 amount)
        public
        virtual
        override
        returns (bool)
    {
        revert("Cannot transfer tickets");
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) public virtual override returns (bool) {
        revert("Cannot transfer tickets");
    }
}
