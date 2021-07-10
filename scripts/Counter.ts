import hre from "hardhat";

async function main() {
	await hre.run("compile");

	const Counter = await hre.ethers.getContractFactory("Counter");
	const counter = await Counter.deploy(10);
	await counter.deployed();
	console.log("Counter deployed to:", counter.address);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
