import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { assert, expect } from "chai";
import hre, { ethers } from "hardhat";
import CakeTogetherAbi from "../artifacts/contracts/CakeTogether.sol/CakeTogether.json";
import { getSavedContractAddress, saveContractAddress } from "../scripts/ScriptsUtils";
import { CakeTogether } from "../typechain/CakeTogether";

// https://github.com/pooltogether/multi-token-listener/blob/master/scripts/createTokenFaucets.ts

const CAKE_TOKEN = "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82";
const CAKE_SYMBOL = "CAKE";
const CAKE_MASTERCHEF = "0x73feaa1ee314f8c655e354234017be2193c9e24e";

const IMPERSONATE_ACCOUNT = "0x9239dF3E9996c776D539EB9f01A8aE8E7957b3c3";

const abi = [
	"function balanceOf(address owner) view returns (uint256)",
	"function decimals() view returns (uint8)",
	"function symbol() view returns (string)",
	"function transfer(address to, uint amount) returns (boolean)",
	"function approve(address spender, uint256 amount) external returns (bool)",
	"function allowance(address owner, address spender) external view returns (uint256)",
	"event Transfer(address indexed from, address indexed to, uint amount)",
];

describe("Hardhat Runtime Environment", function () {
	it("should have a config field", function () {
		assert.notEqual(hre.config, undefined);
	});
});

describe("CakeTogether contract", () => {
	let cakeTogether: CakeTogether;
	let owner: SignerWithAddress;

	before(async () => {
		const signers = await ethers.getSigners();
		owner = signers[0];
		let CakeTogetherContract = await ethers.getContractFactory("CakeTogether");
		const localAddress = getSavedContractAddress("CakeTogether");
		if (localAddress) {
			console.log(`Using old contract address ${localAddress}`);
			cakeTogether = (await ethers.getContractAt(CakeTogetherAbi.abi, localAddress)) as CakeTogether;
		} else {
			cakeTogether = (await CakeTogetherContract.deploy(CAKE_TOKEN, CAKE_MASTERCHEF)) as CakeTogether;
			await cakeTogether.deployed();
			console.log("CakeTogether deployed to:", cakeTogether.address);
			saveContractAddress("CakeTogether", cakeTogether.address);
		}
	});

	beforeEach(async () => {
		await hre.network.provider.request({
			method: "hardhat_impersonateAccount",
			params: [IMPERSONATE_ACCOUNT],
		});
		const impersonatorSigner = await ethers.getSigner(IMPERSONATE_ACCOUNT);
		const cakeToken = new ethers.Contract(CAKE_TOKEN, abi, impersonatorSigner);
		console.log(
			`Impersonator Cake Balance: ${ethers.BigNumber.from(await cakeToken.balanceOf(IMPERSONATE_ACCOUNT)).toString()}`
		);
		await cakeToken.transfer(owner.address, ethers.BigNumber.from("1000"));
		await hre.network.provider.request({
			method: "hardhat_stopImpersonatingAccount",
			params: [IMPERSONATE_ACCOUNT],
		});
	});

	it("Deployment should assign the deployer as owner", async () => {
		expect(await cakeTogether.owner()).to.equal(owner.address);
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
		const cakeToken = new ethers.Contract(CAKE_TOKEN, abi, owner);
		await cakeToken.approve(cakeTogether.address, ethers.utils.parseUnits("9999", "ether"));
		const currentRoundId = await cakeTogether.currentRoundId();
		expect(currentRoundId).to.be.gt(0);
		await expect(cakeTogether.deposit(currentRoundId, ethers.BigNumber.from("42")))
			.to.emit(cakeTogether, "onDeposit")
			.withArgs(currentRoundId, "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", 42);

		const round = await cakeTogether.getRound(currentRoundId);
		expect(ethers.BigNumber.from(round.startTicketId).toString()).to.be.eq("1");
		expect(ethers.BigNumber.from(round.amountCollected).toString()).to.be.eq("42");
		expect(ethers.BigNumber.from(round.endTicketId).toString()).to.be.eq("42");
	});

	it("should allow non-owner to enter round", async () => {
		await hre.network.provider.request({
			method: "hardhat_impersonateAccount",
			params: [IMPERSONATE_ACCOUNT],
		});
		const impersonatorSigner = await ethers.getSigner(IMPERSONATE_ACCOUNT);
		const cakeToken = new ethers.Contract(CAKE_TOKEN, abi, impersonatorSigner);
		await cakeToken.approve(cakeTogether.address, ethers.utils.parseUnits("9999", "ether"));
		const currentRoundId = await cakeTogether.currentRoundId();
		expect(currentRoundId).to.be.gt(0);

		await expect(cakeTogether.deposit(currentRoundId, ethers.BigNumber.from("3")))
			.to.emit(cakeTogether, "onDeposit")
			.withArgs(currentRoundId, "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", 3);

		const round = await cakeTogether.getRound(currentRoundId);
		expect(ethers.BigNumber.from(round.startTicketId).toString()).to.be.eq("1");
		expect(ethers.BigNumber.from(round.amountCollected).toString()).to.be.eq("45");
		expect(ethers.BigNumber.from(round.endTicketId).toString()).to.be.eq("45");

		await hre.network.provider.request({
			method: "hardhat_stopImpersonatingAccount",
			params: [IMPERSONATE_ACCOUNT],
		});
	});
});
