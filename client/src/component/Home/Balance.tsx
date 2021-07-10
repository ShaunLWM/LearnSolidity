import { useWeb3React } from "@web3-react/core";
import { formatEther } from "ethers/lib/utils";
import { useState, useEffect } from "react";

export function Balance() {
	const { account, library, chainId } = useWeb3React();

	const [balance, setBalance] = useState<number>();
	useEffect((): any => {
		if (!!account && !!library) {
			let stale = false;

			library
				.getBalance(account)
				.then((balance: any) => {
					if (!stale) {
						setBalance(balance);
					}
				})
				.catch(() => {
					if (!stale) {
						setBalance(undefined);
					}
				});

			return () => {
				stale = true;
				setBalance(undefined);
			};
		}
	}, [account, library, chainId]); // ensures refresh if referential identity of library doesn't change across chainIds

	return (
		<div>
			<span role="img" aria-label="gold">
				💰
			</span>
			<span>Balance: </span>
			<span>{!balance ? "Error" : balance ? `${formatEther(balance)}` : ""}</span>
		</div>
	);
}
