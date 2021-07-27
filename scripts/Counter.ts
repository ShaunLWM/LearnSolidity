import hre from "hardhat";
import { saveContractAddress } from "./ScriptsUtils";

async function main() {
  await hre.run("compile");

  const Counter = await hre.ethers.getContractFactory("Counter");
  const counter = await Counter.deploy(10);
  await counter.deployed();
  console.log("Counter deployed to:", counter.address);
  saveContractAddress("Counter", counter.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
