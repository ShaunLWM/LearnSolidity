import hre from "hardhat";

async function increaseTime(time: any) {
	let provider = hre.ethers.provider;
	await provider.send("evm_increaseTime", [time]);
	await provider.send("evm_mine", []);
}
