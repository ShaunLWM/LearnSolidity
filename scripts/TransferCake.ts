import { ethers } from "ethers";

async function main() {
	const abi = [
		"function balanceOf(address owner) view returns (uint256)",
		"function decimals() view returns (uint8)",
		"function symbol() view returns (string)",
		"function transfer(address to, uint amount) returns (boolean)",
		"event Transfer(address indexed from, address indexed to, uint amount)",
	];

	const IMPERSONATE_ACCOUNT = "0x9239dF3E9996c776D539EB9f01A8aE8E7957b3c3";
	const CAKE_TOKEN = "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82";

	const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
	await provider.send("hardhat_impersonateAccount", [IMPERSONATE_ACCOUNT]);
	const signer = provider.getSigner(IMPERSONATE_ACCOUNT);

	const cakeToken = new ethers.Contract(CAKE_TOKEN, abi, signer);
	console.log(`Cake Balance: ${ethers.BigNumber.from(await cakeToken.balanceOf(IMPERSONATE_ACCOUNT)).toString()}`);
	console.log(`Symbol: ${await cakeToken.symbol()}`);

	// Transfer to my local account
	const tx = await cakeToken.transfer("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266", ethers.BigNumber.from("20"));
	console.log(tx);
	console.log((await cakeToken.balanceOf("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266")).toString());
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
