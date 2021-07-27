import { expect } from "chai";
import { deployments, ethers } from "hardhat";
import { AuctionHouse } from "../typechain/AuctionHouse";
import { getBlockTimestamp } from "./TestUtils";

const MIN_GWEI = ethers.utils.parseUnits("1.0", "gwei");

describe("AuctionHouse contract", () => {
  let auctionHouse: AuctionHouse;

  before(async () => {
    await deployments.fixture(["AuctionHouse"]);
    auctionHouse = (await ethers.getContract("AuctionHouse")) as AuctionHouse;
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
      const now = await getBlockTimestamp();
      await expect(auctionHouse.newAuction("Action #1", now, now - 86400, MIN_GWEI)).to.be.revertedWith(
        "timeEnd must be more than timeStart"
      );
      expect(await auctionHouse.currentAuctionId()).to.equal(0);
    });

    it("should fail when timeEnd is less than MIN_LENGTH_AUCTION", async () => {
      const now = await getBlockTimestamp();
      await expect(auctionHouse.newAuction("Action #1", now, now + 10, MIN_GWEI)).to.be.revertedWith(
        "Aunction length outside of range"
      );
      expect(await auctionHouse.currentAuctionId()).to.equal(0);
    });

    it("should fail when timeEnd is more than than MAX_LENGTH_AUCTION", async () => {
      const now = await getBlockTimestamp();
      await expect(auctionHouse.newAuction("Action #1", now, now + 604800 + 1, MIN_GWEI)).to.be.revertedWith(
        "Aunction length outside of range"
      );
      expect(await auctionHouse.currentAuctionId()).to.equal(0);
    });

    it("should fail when amount is less than minAuctionStartBid ", async () => {
      const now = await getBlockTimestamp();
      await expect(auctionHouse.newAuction("Action #1", now, now + 86400, MIN_GWEI.sub(10))).to.be.revertedWith(
        "Auction must be more than minAuctionStartBid"
      );
      expect(await auctionHouse.currentAuctionId()).to.equal(0);
    });

    it("successfully deploy a new auction", async () => {
      const now = await getBlockTimestamp();
      await auctionHouse.newAuction("Action #1", now, now + 86400, MIN_GWEI);
      expect(await auctionHouse.currentAuctionId()).to.equal(1);
    });
  });
});
