import { providers as MultiCallProviders } from "@0xsequence/multicall";
import React, { useEffect } from "react";
import { useAuctionContract } from "../hooks/useContract";
import { getMulticallAddress } from "../utils/AddressHelper";
import { getAuctionContract, simpleRpcProvider } from "../utils/ContractHelper";

export default function AuctionHouse() {
	const contract = useAuctionContract();

	useEffect(() => {
		const setup = async () => {
			const currentAuctionId = await contract.currentAuctionId();
			const provider = new MultiCallProviders.MulticallProvider(simpleRpcProvider, {
				contract: getMulticallAddress(),
			});

			const auctionContract = getAuctionContract(provider);
			const calls = Array.from(Array(parseInt(currentAuctionId, 10) + 1).keys())
				.filter((i) => i)
				.map((i) => auctionContract.auctions(i));

			try {
				const multicallRes = await Promise.all(calls);
				console.log(multicallRes[0]);
			} catch (error) {
				console.log(error);
			}
		};

		setup();
	}, [contract]);

	return <div></div>;
}
