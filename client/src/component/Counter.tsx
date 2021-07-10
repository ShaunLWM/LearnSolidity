import { Button, NumberInput } from "@mantine/core";
import { BigNumber, ethers } from "ethers";
import React, { useState } from "react";
import { useCounterContract } from "../hooks/useContract";

export default function Counter() {
	const contract = useCounterContract();

	const [value, setValue] = useState(0);
	const [disabled, setDisabled] = useState(true);
	const [input, setInput] = useState(0);

	const getCounterValue = async () => {
		const value = await contract.counter();
		setValue(ethers.BigNumber.from(value).toNumber());
		setDisabled(false);
	};

	const setUpdateValue = async () => {
		setDisabled(true);
		await contract.add(input);
		contract.on("ValueChanged", (address: string, value: BigNumber) => {
			console.log(`${address} added ${ethers.BigNumber.from(value).toNumber()} to Counter`);
			getCounterValue();
			setValue(0);
			setDisabled(false);
		});
	};

	return (
		<div>
			<Button onClick={getCounterValue}>Get Counter</Button>
			<span>CurrentValue: {value ?? "Error"}</span>
			<div>
				<NumberInput
					defaultValue={input}
					onChange={setInput}
					placeholder="Value"
					label="Value"
					required
					disabled={disabled}
				/>
				<Button onClick={setUpdateValue}>Add value</Button>
			</div>
		</div>
	);
}
