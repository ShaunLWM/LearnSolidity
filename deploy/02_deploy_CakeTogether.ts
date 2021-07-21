import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { XCake } from "../typechain/XCake";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { deployments, getNamedAccounts } = hre;
	const { deploy } = deployments;
	const { deployer, cakeToken, cakeMasterchef } = await getNamedAccounts();
	const xCakeToken = (await ethers.getContract("xCake", deployer)) as XCake;

	const result = await deploy("CakeTogether", {
		from: deployer,
		args: [cakeToken, cakeMasterchef, xCakeToken.address],
		log: true,
	});

	if (result.newlyDeployed) {
		const tx = await xCakeToken.addMinter(result.address);
		await tx.wait();
		console.log(tx);
	}
};

export default func;
func.tags = ["CakeTogether"];
func.dependencies = ["xCake"];
