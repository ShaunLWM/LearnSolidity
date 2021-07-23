import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const { deployments, getNamedAccounts } = hre;
	const { deploy } = deployments;
	const { deployer } = await getNamedAccounts();

	const result = await deploy("xCake", {
		from: deployer,
		args: [0],
		log: true,
	});

	if (result.newlyDeployed) {
		await hre.ethernal.push({
			name: "xCake",
			address: result.address,
		});
	}
};

export default func;
func.tags = ["xCake"];
