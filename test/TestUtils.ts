import hre, { ethers } from "hardhat";

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
