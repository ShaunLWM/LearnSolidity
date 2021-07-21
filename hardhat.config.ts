import "dotenv/config";

import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import "hardhat-abi-exporter";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "hardhat-gas-reporter";
import { removeConsoleLog } from "hardhat-preprocessor";
import "hardhat-watcher";
import { HardhatUserConfig, task } from "hardhat/config";

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
	const accounts = await hre.ethers.getSigners();

	for (const account of accounts) {
		console.log(account.address);
	}
});

const accounts = {
	mnemonic: process.env.MNEMONIC || "test test test test test test test test test test test junk",
};

module.exports = {
	defaultNetwork: "hardhat",
	networks: {
		localhost: {
			live: false,
			saveDeployments: true,
			tags: ["local"],
		},
		hardhat: {
			chainId: 1,
			loggingEnabled: true,
			live: false,
			saveDeployments: true,
			accounts: {
				accountsBalance: "100000000000000000000000",
				count: 5,
			},
			forking: {
				enabled: process.env.FORKING === "true",
				url: process.env.HARDHAT_NETWORK_FORK_URL,
				blockNumber: Number(process.env.HARDHAT_NETWORK_FORK_BLOCK),
			},
			tags: ["test", "local"],
		},
		bsc: {
			url: "https://bsc-dataseed.binance.org",
			accounts,
			chainId: 56,
			live: true,
			saveDeployments: true,
		},
		"bsc-testnet": {
			url: "https://data-seed-prebsc-2-s3.binance.org:8545",
			accounts,
			chainId: 97,
			live: true,
			saveDeployments: true,
			tags: ["staging"],
			gasMultiplier: 2,
		},
	},
	namedAccounts: {
		deployer: 0,
		cakeMasterchef: "0x73feaa1ee314f8c655e354234017be2193c9e24e",
		cakeToken: "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
		cakeWhale: "0x9239dF3E9996c776D539EB9f01A8aE8E7957b3c3",
	},
	preprocess: {
		eachLine: removeConsoleLog((bre) => bre.network.name !== "hardhat" && bre.network.name !== "localhost"),
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
		compile: {
			tasks: ["compile"],
			files: ["./contracts"],
			verbose: true,
		},
	},
	abiExporter: {
		path: "./abi",
		clear: false,
		flat: true,
		// only: [],
		// except: []
	},
	mocha: {
    timeout: 1200000,
  },
} as HardhatUserConfig;
