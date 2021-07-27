import hre from "hardhat";
import { saveContractAddress } from "./ScriptsUtils";

async function main() {
  await hre.run("compile");

  const AuctionHouse = await hre.ethers.getContractFactory("AuctionHouse");
  const auctionHouse = await AuctionHouse.deploy();
  await auctionHouse.deployed();
  console.log("AuctionHouse deployed to:", auctionHouse.address);
  saveContractAddress("AuctionHouse", auctionHouse.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
