import { useMemo } from "react";
import { getCounterContract } from "../utils/ContractHelper";
import useWeb3Provider from "./useWeb3Provider";

export const useCounterContract = () => {
	const provider = useWeb3Provider();
	return useMemo(() => getCounterContract(provider.getSigner()), [provider]);
};
