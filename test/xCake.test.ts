import { expect } from "chai";
import { ethers } from "hardhat";
import { XCake } from "../typechain/XCake";
import { setupTest } from "./setup";

describe("xCake", function () {
  let xCake: XCake;

  before(async () => {
    const results = await setupTest();
    xCake = results.deployer.xCake;
  });

  it("should have correct name and symbol and decimal", async function () {
    const name = await xCake.name();
    const symbol = await xCake.symbol();
    const decimals = await xCake.decimals();
    expect(name, "xCakeToken");
    expect(symbol, "XCK");
    expect(decimals, "18");
  });

  it("should only allow owner to mint token", async () => {
    const [alice, bob, carol] = await ethers.getUnnamedSigners();
    await xCake.mint(alice.address, "100");
    await xCake.mint(bob.address, "1000");
    await expect(xCake.connect(bob).mint(carol.address, "1000", { from: bob.address })).to.be.revertedWith(
      "Not minter"
    );
    const totalSupply = await xCake.totalSupply();
    const aliceBal = await xCake.balanceOf(alice.address);
    const bobBal = await xCake.balanceOf(bob.address);
    const carolBal = await xCake.balanceOf(carol.address);
    expect(totalSupply).to.equal("1100");
    expect(aliceBal).to.equal("100");
    expect(bobBal).to.equal("1000");
    expect(carolBal).to.equal("0");
  });

  it("should not allow users to transfer token", async () => {
    const [, bob, carol] = await ethers.getUnnamedSigners();
    await expect(xCake.connect(bob).transfer(carol.address, 10)).to.be.revertedWith("Cannot transfer tickets");
    const bobBal = await xCake.balanceOf(bob.address);
    const carolBal = await xCake.balanceOf(carol.address);
    expect(bobBal).to.equal("1000");
    expect(carolBal).to.equal("0");
  });
});
