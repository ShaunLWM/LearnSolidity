import { useWeb3React } from "@web3-react/core";

export function Account() {
	const { account } = useWeb3React();

	return (
		<div>
			<span role="img" aria-label="robot">
				🤖
			</span>
			<span>Account: </span>
			<span>{account ?? ""}</span>
		</div>
	);
}
