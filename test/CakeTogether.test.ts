import { Contract } from "@ethersproject/contracts";
import { assert, expect } from "chai";
import { ethers } from "hardhat";
import hre from "hardhat";

const CAKE_TOKEN = "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82";
const CAKE_SYMBOL = "CAKE";
const CAKE_MASTERCHEF = "0x73feaa1ee314f8c655e354234017be2193c9e24e";

describe("Hardhat Runtime Environment", function () {
	it("should have a config field", function () {
		assert.notEqual(hre.config, undefined);
	});
});

describe("CakeTogether contract", () => {
	let cakeTogether: Contract;

	beforeEach(async () => {
		const CakeTogetherContract = await ethers.getContractFactory("CakeTogether");
		cakeTogether = await CakeTogetherContract.deploy(CAKE_TOKEN, CAKE_MASTERCHEF);
		await hre.network.provider.request({
			method: "hardhat_impersonateAccount",
			params: ["0x9239dF3E9996c776D539EB9f01A8aE8E7957b3c3"],
		});
	});

	it("Deployment should assign the deployer as owner", async () => {
		const [owner] = await ethers.getSigners();
		console.log(`OwnerAddress: ${owner.address}`);
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
});