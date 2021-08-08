import { time } from "@openzeppelin/test-helpers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import hre, { ethers, getNamedAccounts } from "hardhat";
import { CakeTogether } from "../typechain/CakeTogether";
import { XCake } from "../typechain/XCake";
import { setupTest } from "./setup";
import { advanceNBlock } from "./TestUtils";
import BN from "bn.js";

const abi = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function transfer(address to, uint amount) returns (boolean)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint amount)",
];

describe("CakeTogether contract", () => {
  let cakeTogether: CakeTogether;
  let xCake: XCake;
  let owner: string;

  let IMPERSONATE_ACCOUNT: string;
  let CAKE_TOKEN: string;

  before(async () => {
    const accounts = await getNamedAccounts();
    const results = await setupTest();
    cakeTogether = results.deployer.cakeTogether;
    xCake = results.deployer.xCake;
    owner = results.deployer.address;

    IMPERSONATE_ACCOUNT = accounts.cakeWhale;
    CAKE_TOKEN = accounts.cakeToken;
  });

  beforeEach(async () => {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [IMPERSONATE_ACCOUNT],
    });
    const impersonatorSigner = await ethers.getSigner(IMPERSONATE_ACCOUNT);
    const cakeToken = new ethers.Contract(CAKE_TOKEN, abi, impersonatorSigner);
    await cakeToken.connect(impersonatorSigner).transfer(owner, ethers.BigNumber.from("99999999"));
    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [IMPERSONATE_ACCOUNT],
    });
  });

  it("Deployment should assign the deployer as owner", async () => {
    expect(await cakeTogether.owner()).to.equal(owner);
  });

  it("currentRoundId should be 0", async () => {
    expect(await cakeTogether.currentRoundId()).to.equal(0);
  });

  it("poolAddress should be same as CAKE_MASTERCHEF", async () => {
    // lowercase/upper case problem
    expect(await cakeTogether.poolAddress()).to.equal("0x73feaa1eE314F8c655E354234017bE2193C9E24E");
  });

  it("token.symbol should be same as CAKE_SYMBOL", async () => {
    const token = await cakeTogether.token();
    expect(token).to.equal("0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82");
  });

  it("should not allow non owner to createRound", async () => {
    const [_, impersonator] = await ethers.getSigners();
    await expect(cakeTogether.connect(impersonator).createRound()).to.be.reverted;
    expect(await cakeTogether.currentRoundId()).to.be.eq(0);
  });

  it("should allow owner to createRound", async () => {
    await cakeTogether.createRound();
    expect(await cakeTogether.currentRoundId()).to.be.eq(1);
  });

  it("should allow owner to enter round", async () => {
    console.time("Hello");
    const currentBlock = await time.latest();
    const cakeToken = new ethers.Contract(CAKE_TOKEN, abi, await ethers.getSigner(owner));
    await cakeToken.approve(cakeTogether.address, ethers.utils.parseUnits("9999", "ether"));
    const currentRoundId = await cakeTogether.currentRoundId();
    expect(currentRoundId).to.be.gt(0);
    await expect(cakeTogether.deposit(currentRoundId, ethers.BigNumber.from("9999")))
      .to.emit(cakeTogether, "onDeposit")
      .withArgs(currentRoundId, "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", 9999);

    const round = await cakeTogether.getRound(currentRoundId);
    expect(ethers.BigNumber.from(round.startTicketId).toString()).to.be.eq("1");
    expect(ethers.BigNumber.from(round.amountCollected).toString()).to.be.eq("9999");
    expect(ethers.BigNumber.from(round.endTicketId).toString()).to.be.eq("9999");

    const ticket = await xCake.balanceOf(owner);
    expect(ticket).to.be.eq(9999);

    const totalMinted = await xCake.totalSupply();
    expect(totalMinted).to.be.eq(9999); 
    console.log(`Old BLock ${await time.latest()}, ${await time.latestBlock()}`);
    await time.increase(2629743 * 3);
    await time.advanceBlock();
    console.log(`New BLock ${await time.latest()}, ${await time.latestBlock()}`);
    // await advanceNBlock(2400);
    const pendingRewards = await cakeTogether.getPendingRewards();
    console.log(`------- PENDING REWARDS: ${pendingRewards}`);
    const pendingRewards2 = await cakeTogether.getStaked();
    console.log(`------- USERINFO: ${pendingRewards2}`);
    const tx = await cakeTogether.leave();
    await tx.wait();
    const balance = await cakeToken.balanceOf(cakeTogether.address);
    console.log(`NEW BALKACE ${balance}`);
    console.timeEnd("Hello");
  });

  it.skip("should allow non-owner to enter round", async () => {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [IMPERSONATE_ACCOUNT],
    });
    const impersonatorSigner = await ethers.getSigner(IMPERSONATE_ACCOUNT);
    const cakeToken = new ethers.Contract(CAKE_TOKEN, abi, impersonatorSigner);
    await cakeToken.connect(impersonatorSigner).approve(cakeTogether.address, ethers.utils.parseUnits("9999", "ether"));
    const currentRoundId = await cakeTogether.currentRoundId();
    expect(currentRoundId).to.be.gt(0);

    await expect(cakeTogether.connect(impersonatorSigner).deposit(currentRoundId, ethers.BigNumber.from("3")))
      .to.emit(cakeTogether, "onDeposit")
      .withArgs(currentRoundId, "0x9239dF3E9996c776D539EB9f01A8aE8E7957b3c3", 3);

    const round = await cakeTogether.getRound(currentRoundId);
    expect(ethers.BigNumber.from(round.startTicketId).toString()).to.be.eq("1");
    expect(ethers.BigNumber.from(round.amountCollected).toString()).to.be.eq("1003");
    expect(ethers.BigNumber.from(round.endTicketId).toString()).to.be.eq("1003");

    const ticket = await xCake.balanceOf(IMPERSONATE_ACCOUNT);
    expect(ticket).to.be.eq(3);

    const totalMinted = await xCake.totalSupply();
    expect(totalMinted).to.be.eq(totalMinted);
    await hre.network.provider.request({
      method: "hardhat_stopImpersonatingAccount",
      params: [IMPERSONATE_ACCOUNT],
    });
  });
});
