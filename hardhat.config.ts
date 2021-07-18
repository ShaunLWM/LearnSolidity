import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-watcher";

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
	const accounts = await hre.ethers.getSigners();

	for (const account of accounts) {
		console.log(account.address);
	}
});

task("tests", "dat", async (taskArgs, hre) => {
	console.log("tests");
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
	defaultNetwork: "ganache",
	networks: {
		ganache: {
			url: "http://127.0.0.1:7545",
			accounts: [
				"a2d64c7b33e066eb6d69fdf3bdc53a19763cdc7ed0e26e42d67be0cfd8a00c91",
				"8030fd93ab8552037dfc9618c7fc8df53b5dd02f8f7d36015d138f9209110be0",
			],
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
};
