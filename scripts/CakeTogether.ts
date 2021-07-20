import hre, { ethers } from "hardhat";

const CAKE_TOKEN = "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82";
const CAKE_SYMBOL = "CAKE";
const CAKE_MASTERCHEF = "0x73feaa1ee314f8c655e354234017be2193c9e24e";

async function main() {
	await hre.run("compile");

	const xCakeToken = await hre.ethers.getContractFactory("xCake");
	const xCake = await xCakeToken.deploy(0);
	await xCake.deployed();
	console.log("xCake token deployed to:", xCake.address);
	// start with 0 tickets. tickers are only minted when user deposit their Cake to get Tickets, burned when used/round over

	const CakeTogether = await hre.ethers.getContractFactory("CakeTogether");
	const cakeTogether = await CakeTogether.deploy(CAKE_TOKEN, CAKE_MASTERCHEF);
	await cakeTogether.deployed();
	console.log("CakeTogether deployed to:", cakeTogether.address);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
