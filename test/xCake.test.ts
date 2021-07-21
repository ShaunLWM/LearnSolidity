import { deployments, ethers } from "hardhat";
import { expect } from "chai";
import { XCake } from "../typechain/XCake";

describe("xCake", function () {
	let xCake: XCake;

	before(async () => {
		await deployments.fixture(["xCake"]);
		xCake = (await ethers.getContract("xCake")) as XCake;
	});

	it("should have correct name and symbol and decimal", async function () {
		const name = await xCake.name();
		const symbol = await xCake.symbol();
		const decimals = await xCake.decimals();
		expect(name, "xCakeToken");
		expect(symbol, "XCK");
		expect(decimals, "18");
	});
});
