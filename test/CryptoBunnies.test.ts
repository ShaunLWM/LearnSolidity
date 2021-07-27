import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signers";
import { expect } from "chai";
import { ethers, getNamedAccounts } from "hardhat";
import { CryptoBunny } from "../typechain/CryptoBunny";
import { setupTest } from "./setup";

enum Status {
	Invalid,
	Open,
	Withdrawn,
	Sold,
}

const TOTAL_SUPPLY = 9999;

describe("CakeTogether contract", () => {
	let CryptoBunny: CryptoBunny;
	let owner: string;

	const setRemainingBunnies = async (count = 0) => {
		const tx = await CryptoBunny.setBunniesRemaining(count);
		await tx.wait();
	};

	before(async () => {
		const accounts = await getNamedAccounts();
		const results = await setupTest();
		CryptoBunny = results.deployer.CryptoBunny;
		owner = accounts.deployer;
	});

	it("should check for post deployment values", async () => {
		expect(await CryptoBunny.owner()).to.equal(owner);
		expect(await CryptoBunny.bunniesRemaining()).to.be.equal(TOTAL_SUPPLY + 1);
	});

	it("should fail on wrong index", async () => {
		await setRemainingBunnies();

		await expect(CryptoBunny.getBunny(10000)).to.be.revertedWith("bunnyIndex out of range");
		await expect(CryptoBunny.offerBunnyForSale(10000, 1000)).to.be.revertedWith("bunnyIndex out of range");
		await expect(CryptoBunny.withdrawBunnySale(10000)).to.be.revertedWith("bunnyIndex out of range");
		await expect(CryptoBunny.bidBunny(10000, 100)).to.be.revertedWith("bunnyIndex out of range");
		await expect(CryptoBunny.acceptBid(10000)).to.be.revertedWith("bunnyIndex out of range");
		await expect(CryptoBunny.buyBunny(10000)).to.be.revertedWith("bunnyIndex out of range");
	});

	describe("Post Deployment", () => {
		let alice: SignerWithAddress;
		let bob: SignerWithAddress;
		let BobCryptoBunny: CryptoBunny;
		let AliceCryptoBunny: CryptoBunny;

		before(async () => {
			await setRemainingBunnies(TOTAL_SUPPLY + 1);

			const accounts = await ethers.getSigners();
			alice = accounts[0];
			bob = accounts[1];
			BobCryptoBunny = CryptoBunny.connect(bob);
			AliceCryptoBunny = CryptoBunny.connect(alice);
		});

		it("should correctly assign Alice address to bunny 0", async () => {
			await expect(AliceCryptoBunny.getBunny(0)).to.emit(CryptoBunny, "BunnyMinted").withArgs(alice.address, 0);
			expect(await CryptoBunny.bunnyToAddress(0)).to.be.eq(alice.address);
			expect(await CryptoBunny.bunniesRemaining()).to.be.eq(9999);
			expect(await CryptoBunny.balanceOf(alice.address)).to.be.eq(1);
		});

		it("should not allow non-owner to commit bunny action", async () => {
			await setRemainingBunnies();
			await expect(BobCryptoBunny.withdrawBunnySale(0)).to.be.revertedWith("Not bunny owner");
			await expect(BobCryptoBunny.acceptBid(0)).to.be.revertedWith("Not bunny owner");
		});

		it("should not allow actions on non-sale bunny", async () => {
			await expect(AliceCryptoBunny.withdrawBunnySale(0)).to.be.revertedWith("Bunny is not on sale");
		});

		it("should allow bid before pre-sale of bunny", async () => {
			await setRemainingBunnies();

			await expect(BobCryptoBunny.bidBunny(0, ethers.utils.parseUnits("1", "ether")))
				.to.emit(CryptoBunny, "BunnyBid")
				.withArgs(0, bob.address, ethers.utils.parseUnits("1", "ether"));

			const offer = await CryptoBunny.bunnyOffer(0);
			expect(offer.status).to.be.eq(Status.Invalid);

			const bid = await CryptoBunny.bunnyBids(0);
			expect(bid.bidder).eq(bob.address);
			expect(bid.price).eq(ethers.utils.parseUnits("1", "ether"));
		});

		it("should not allow sale before all bunnies are claimed", async () => {
			await setRemainingBunnies(TOTAL_SUPPLY + 1);
			await expect(AliceCryptoBunny.offerBunnyForSale(0, ethers.utils.parseUnits("1", "ether"))).to.be.revertedWith(
				"All bunnies have to be claimed first"
			);
		});

		it("should allow proper sale of bunny", async () => {
			await setRemainingBunnies();

			const tx = await AliceCryptoBunny.offerBunnyForSale(0, ethers.utils.parseUnits("1", "ether"));
			await tx.wait();

			const offer = await CryptoBunny.bunnyOffer(0);
			expect(offer).not.to.be.undefined;
			expect(offer.selectedBidder).to.be.eq("0x0000000000000000000000000000000000000000");
			expect(offer.status).to.be.eq(Status.Open);
		});

		it("should not allow owner to bid for their bunny", async () => {
			await expect(AliceCryptoBunny.bidBunny(0, 10)).to.be.revertedWith("You cannot bid for your own bunny");
		});

		it("should allow proper bidding of bunny", async () => {
			const offer = await CryptoBunny.bunnyOffer(0);
			expect(offer).not.to.be.undefined;
			expect(offer.selectedBidder).to.be.eq("0x0000000000000000000000000000000000000000");
			const tx = await BobCryptoBunny.bidBunny(0, ethers.utils.parseUnits("1.1", "ether"));
			await tx.wait();
			const bid = await CryptoBunny.bunnyBids(0);
			console.log(bid);
			expect(bid).not.to.be.undefined;
			expect(bid.bidder).equal(bob.address);
			expect(bid.price).equal(ethers.utils.parseEther("1.1"));
		});
	});
});
