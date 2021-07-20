import fs from "fs-extra";

export const saveContractAddress = (key: string, address: string): void => {
	if (!fs.existsSync("contracts.json")) {
		return fs.writeJsonSync("contracts.json", {
			[key]: address,
		});
	}
	const config = fs.readJsonSync("contracts.json");
	config[key] = address;
	return fs.writeJsonSync("contracts.json", config);
};

export const getSavedContractAddress = (key: string): string | undefined => {
	if (!fs.existsSync("contracts.json")) {
		return undefined;
	}

	const config = fs.readJsonSync("contracts.json");
	if (!config[key]) {
		return undefined;
	}

	return config[key];
};
