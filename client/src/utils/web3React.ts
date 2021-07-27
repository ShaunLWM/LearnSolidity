import { InjectedConnector } from "@web3-react/injected-connector";
import { ethers } from "ethers";

export enum ConnectorNames {
  Injected = "injected",
}

const POLLING_INTERVAL = 12000;
export const rpcUrl = "http://127.0.0.1:7545";
const chainId = parseInt("1337", 10);

export const injected = new InjectedConnector({ supportedChainIds: [chainId] });

export const connectorsByName: { [connectorName in ConnectorNames]: any } = {
  [ConnectorNames.Injected]: injected,
};

export const getLibrary = (provider: any): ethers.providers.Web3Provider => {
  const library = new ethers.providers.Web3Provider(provider);
  library.pollingInterval = POLLING_INTERVAL;
  return library;
};
