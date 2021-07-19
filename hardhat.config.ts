import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "hardhat-watcher";
import { HardhatUserConfig, task } from "hardhat/config";

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
	const accounts = await hre.ethers.getSigners();

	for (const account of accounts) {
		console.log(account.address);
	}
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
	defaultNetwork: "hardhat",
	networks: {
		ganache: {
			url: "http://127.0.0.1:7545",
			accounts: [
				"a2d64c7b33e066eb6d69fdf3bdc53a19763cdc7ed0e26e42d67be0cfd8a00c91",
				"8030fd93ab8552037dfc9618c7fc8df53b5dd02f8f7d36015d138f9209110be0",
			],
		},
		hardhat: {
			accounts: {
				accountsBalance: "100000000000000000000000",
			},
			forking: {
				url: "https://bsc.getblock.io/mainnet/?api_key=65f1d98d-ac5a-45f8-be38-00ca29126f92",
				blockNumber: 9286193,
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
