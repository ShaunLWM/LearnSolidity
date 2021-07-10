import { useWeb3React } from "@web3-react/core";

export function ChainId() {
	const { chainId } = useWeb3React();

	return (
		<>
			<span role="img" aria-label="chain">
				⛓
			</span>
			<span>Chain Id: </span>
			<span>{chainId ?? ""}</span>
		</>
	);
}
