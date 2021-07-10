import { Button } from "@mantine/core";
import { ethers } from "ethers";
import React, { useState } from "react";
import { getCounterContract } from "../utils/ContractHelper";

export default function Counter() {
	const [value, setValue] = useState("");

	const getCounterValue = async () => {
		const counterContract = getCounterContract();
		const value = await counterContract.counter();
		setValue(ethers.BigNumber.from(value).toString());
	};

	return (
		<div>
			<Button onClick={getCounterValue}>Get Counter</Button>
			<span>CurrentValue: {value ?? "Error"}</span>
		</div>
	);
}
