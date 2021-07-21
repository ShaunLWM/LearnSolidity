import { ethers, getNamedAccounts } from "hardhat";
import { CakeTogether } from "../typechain/CakeTogether";
import { XCake } from "../typechain/XCake";

export const setupAccounts = async () => {
	const { deployer, ...accounts } = await getNamedAccounts();
	return {
		deployer: await setupAccount(deployer),
		accounts: {
			...accounts,
		},
	};
};

export const setupAccount = async (signer: string) => {
	return {
		address: signer,
		cakeTogether: (await ethers.getContract("CakeTogether", signer)) as CakeTogether,
		xCake: (await ethers.getContract("xCake", signer)) as XCake,
	};
};
