import hre, { ethers } from "hardhat";

async function main() {
	// https://github.com/austintgriffith/scaffold-eth/blob/mainnet-fork-session/packages/react-app/src/App.jsx#L126
	const abi = [
		"function balanceOf(address owner) view returns (uint256)",
		"function decimals() view returns (uint8)",
		"function symbol() view returns (string)",
		"function transfer(address to, uint amount) returns (boolean)",
		"function approve(address spender, uint256 amount) external returns (bool)",
		"function allowance(address owner, address spender) external view returns (uint256)",
		"event Transfer(address indexed from, address indexed to, uint amount)",
	];

	const [owner] = await ethers.getSigners();
	const IMPERSONATE_ACCOUNT = "0x9239dF3E9996c776D539EB9f01A8aE8E7957b3c3";
	const CAKE_TOKEN = "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82";

	await hre.network.provider.request({
		method: "hardhat_impersonateAccount",
		params: [IMPERSONATE_ACCOUNT],
	});

	const impersonatorSigner = await ethers.getSigner(IMPERSONATE_ACCOUNT);
	const cakeToken = new ethers.Contract(CAKE_TOKEN, abi, impersonatorSigner);
	console.log(
		`Impersonator Cake Balance: ${ethers.BigNumber.from(await cakeToken.balanceOf(IMPERSONATE_ACCOUNT)).toString()}`
	);

	await cakeToken.transfer(owner.address, ethers.BigNumber.from("1000"));
	console.log((await cakeToken.balanceOf(owner.address)).toString());
	await hre.network.provider.request({
		method: "hardhat_stopImpersonatingAccount",
		params: [IMPERSONATE_ACCOUNT],
	});
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
