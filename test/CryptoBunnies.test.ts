import { expect } from "chai";
import hre, { ethers, getNamedAccounts } from "hardhat";
import { CryptoBunny } from "../typechain/CryptoBunny";
import { setupTest } from "./setup";

describe("CakeTogether contract", () => {
	let CryptoBunny: CryptoBunny;
	let owner: string;

	before(async () => {
		const accounts = await getNamedAccounts();
		const results = await setupTest();
		CryptoBunny = results.deployer.CryptoBunny;
	});

	it("should check for post deployment values", async () => {
		expect(await CryptoBunny.owner()).to.equal(owner);
		expect(await CryptoBunny.bunniesRemaining()).to.be.equal(10000);
	});
});
