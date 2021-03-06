import Addresses from "../config/constants/contracts";

export interface Address {
  97?: string;
  56?: string;
  1337: string;
}

export const getAddress = (address: Address): string => {
  const chainId = 1337;
  return address[chainId] ? address[chainId] : address[1337];
};

export const getCounterAddress = () => {
  return getAddress(Addresses.counter);
};

export const getAuctionAddress = () => {
  return getAddress(Addresses.auction);
};

export const getMulticallAddress = () => {
  return getAddress(Addresses.multicall);
};
