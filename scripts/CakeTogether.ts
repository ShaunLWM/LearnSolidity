import hre from "hardhat";

const CAKE_TOKEN = "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82";
const CAKE_SYMBOL = "CAKE";
const CAKE_MASTERCHEF = "0x73feaa1ee314f8c655e354234017be2193c9e24e";

async function main() {
	await hre.run("compile");

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
