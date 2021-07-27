//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract xCake is ERC20, Ownable {
  mapping(address => bool) public minters;

  constructor(uint256 initialSupply) ERC20("xCake", "XCK") {
    _mint(msg.sender, initialSupply);
  }

  modifier onlyMinters() {
    require(msg.sender == owner() || minters[msg.sender], "Not minter");
    _;
  }

  function mint(address to, uint256 amount) external onlyMinters {
    _mint(to, amount);
  }

  function addMinter(address _minter) external onlyMinters {
    minters[_minter] = true;
  }

  function removeMinter(address _minter) external onlyMinters {
    minters[_minter] = false;
  }

  function transfer(address recipient, uint256 amount) public virtual override returns (bool) {
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
