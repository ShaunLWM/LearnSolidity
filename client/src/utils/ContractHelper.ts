import { ethers } from "ethers";
import AuctionHouseAbi from "../abi/AuctionHouse.json";
import CounterAbi from "../abi/Counter.json";
import MultiCallAbi from "../abi/Multicall2.json";
import { getAuctionAddress, getCounterAddress, getMulticallAddress } from "./AddressHelper";
import { rpcUrl } from "./web3React";

export const simpleRpcProvider = new ethers.providers.JsonRpcProvider(rpcUrl);

const getContract = (abi: any, address: string, signer?: ethers.Signer | ethers.providers.Provider) => {
  const signerOrProvider = signer ?? simpleRpcProvider;
  return new ethers.Contract(address, abi, signerOrProvider);
};

export const getCounterContract = (signer?: ethers.Signer | ethers.providers.Provider) => {
  return getContract(CounterAbi.abi, getCounterAddress(), signer);
};

export const getAuctionContract = (signer?: ethers.Signer | ethers.providers.Provider) => {
  return getContract(AuctionHouseAbi.abi, getAuctionAddress(), signer);
};

// Multicall2
export const getMultiCallContract = (signer?: ethers.Signer | ethers.providers.Provider) => {
  return getContract(MultiCallAbi.abi, getMulticallAddress(), signer);
};
