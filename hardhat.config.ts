import "dotenv/config";

import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "hardhat-gas-reporter";
import "hardhat-watcher";
import { HardhatUserConfig, task } from "hardhat/config";

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
	const accounts = await hre.ethers.getSigners();

	for (const account of accounts) {
		console.log(account.address);
	}
});

module.exports = {
	defaultNetwork: "hardhat",
	networks: {
		hardhat: {
			loggingEnabled: true,
			live: false,
			saveDeployments: true,
			accounts: {
				accountsBalance: "100000000000000000000000",
				count: 5,
			},
			forking: {
				url: process.env.HARDHAT_NETWORK_FORK_URL,
				blockNumber: Number(process.env.HARDHAT_NETWORK_FORK_BLOCK),
			},
		},
	},
	solidity: {
		version: "0.8.4",
		settings: {
			optimizer: {
				enabled: true,
				runs: 1000,
			},
		},
	},
	watcher: {
		test: {
			tasks: [{ command: "test", params: { testFiles: ["{path}"] } }],
			files: ["./test/**/*"],
			verbose: true,
		},
	},
} as HardhatUserConfig;
