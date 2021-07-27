import hre, { ethers } from "hardhat";
import { time } from "@openzeppelin/test-helpers";

const provider = new ethers.providers.JsonRpcProvider();

export async function getBlockNumber() {
  return await provider.getBlockNumber();
}

export async function increaseTime(time: any) {
  let provider = hre.ethers.provider;
  await provider.send("evm_increaseTime", [time]);
  await provider.send("evm_mine", []);
}

export async function getBlockTimestamp() {
  let block = await provider.getBlock(await getBlockNumber());
  return block.timestamp;
}

export async function setBlockTime(ts: number) {
  await provider.send("evm_setNextBlockTimestamp", [ts]);
}

export async function mineBlock(count: number, seconds?: number) {
  await ethers.provider.send("evm_increaseTime", [seconds ?? count * 15]);
  for (let i = 0; i < count; i++) {
    await provider.send("evm_mine", []);
  }
}

export async function advanceNBlock(n: number) {
  let startingBlock = await time.latestBlock();
  await time.increase(15 * Math.round(n));
  let endBlock = startingBlock.addn(n);
  await time.advanceBlockTo(endBlock);
}
