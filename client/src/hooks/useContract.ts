import { useMemo } from "react";
import { getAuctionContract, getCounterContract, getMultiCallContract } from "../utils/ContractHelper";
import useWeb3Provider from "./useWeb3Provider";

export const useCounterContract = () => {
	const provider = useWeb3Provider();
	return useMemo(() => getCounterContract(provider.getSigner()), [provider]);
};

export const useAuctionContract = () => {
	const provider = useWeb3Provider();
	return useMemo(() => getAuctionContract(provider.getSigner()), [provider]);
};

export const useMultiCallContract = () => {
	const provider = useWeb3Provider();
	return useMemo(() => getMultiCallContract(provider.getSigner()), [provider]);
};
