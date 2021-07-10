import { ethers } from "ethers";

import CounterAbi from "../abi/Counter.json";
import MultiCallAbi from "../abi/Multicall.json";
import { rpcUrl } from "./web3React";

export const simpleRpcProvider = new ethers.providers.JsonRpcProvider(rpcUrl);

const getContract = (abi: any, address: string, signer?: ethers.Signer | ethers.providers.Provider) => {
	const signerOrProvider = signer ?? simpleRpcProvider;
	return new ethers.Contract(address, abi, signerOrProvider);
};

export const getCounterContract = (signer?: ethers.Signer | ethers.providers.Provider) => {
	return getContract(CounterAbi.abi, "0x8a1A1c315E4E354eB380bEa3e89fc5293397d701", signer);
};

export const getMultiCallContract = (signer?: ethers.Signer | ethers.providers.Provider) => {
	return getContract(MultiCallAbi.abi, "0x41B315B6a2f3F3e6380309d6e6c3Ede5496b641A", signer);
};