import { Contract } from "@ethersproject/contracts";
import { expect } from "chai";
import { ethers } from "hardhat";

const WEI = ethers.BigNumber.from(1).mul(10).pow(9);

describe("AuctionHouse contract", () => {
	let auctionHouse: Contract;

	beforeEach(async () => {
		const AuctionHouseContract = await ethers.getContractFactory("AuctionHouse");
		auctionHouse = await AuctionHouseContract.deploy();
	});

	it("Deployment should assign the deployer as owner", async () => {
		const [owner] = await ethers.getSigners();
		expect(await auctionHouse.owner()).to.equal(owner.address);
	});

	it("currentAuctionId should be 0", async () => {
		expect(await auctionHouse.currentAuctionId()).to.equal(0);
	});

	describe("Creating Auction", () => {
		it("should fail when timeEnd < timeStart", async () => {
			const now = Math.round(new Date().getTime() / 1000);
			await expect(auctionHouse.newAuction("Action #1", now, now - 86400, WEI)).to.be.revertedWith(
				"timeEnd must be more than timeStart"
			);
			expect(await auctionHouse.currentAuctionId()).to.equal(0);
		});

		it("should fail when timeEnd is less than MIN_LENGTH_AUCTION", async () => {
			const now = Math.round(new Date().getTime() / 1000);
			await expect(auctionHouse.newAuction("Action #1", now, now + 10, WEI)).to.be.revertedWith(
				"Aunction length outside of range"
			);
			expect(await auctionHouse.currentAuctionId()).to.equal(0);
		});

		it("should fail when timeEnd is more than than MAX_LENGTH_AUCTION", async () => {
			const now = Math.round(new Date().getTime() / 1000);
			await expect(auctionHouse.newAuction("Action #1", now, now + 604800 + 1, WEI)).to.be.revertedWith(
				"Aunction length outside of range"
			);
			expect(await auctionHouse.currentAuctionId()).to.equal(0);
		});

		it("should fail when amount is less than minAuctionStartBid ", async () => {
			const now = Math.round(new Date().getTime() / 1000);
			await expect(auctionHouse.newAuction("Action #1", now, now + 86400, WEI.sub(10))).to.be.revertedWith(
				"Auction must be more than minAuctionStartBid"
			);
			expect(await auctionHouse.currentAuctionId()).to.equal(0);
		});

		it("successfully deploy a new auction", async () => {
			const now = Math.round(new Date().getTime() / 1000);
			await auctionHouse.newAuction("Action #1", now, now + 86400, WEI);
			expect(await auctionHouse.currentAuctionId()).to.equal(1);
		});
	});
});