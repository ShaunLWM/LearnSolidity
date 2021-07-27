import { providers as MultiCallProviders } from "@0xsequence/multicall";
import { Card } from "@mantine/core";
import { BigNumber, ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { useAuctionContract } from "../hooks/useContract";
import { getMulticallAddress } from "../utils/AddressHelper";
import { getAuctionContract, simpleRpcProvider } from "../utils/ContractHelper";

interface Bid {
  bidTime: BigNumber;
  price: BigNumber;
  user: string;
}

interface Auction {
  auctionName: string;
  timeCreated: BigNumber;
  timeStart: BigNumber;
  timeEnd: BigNumber;
  createdBy: BigNumber;
  bidCount: BigNumber;
  basePrice: BigNumber;
  currentHighestBid: Bid;
}

export default function AuctionHouse() {
  const contract = useAuctionContract();
  const [auctions, setAuctions] = useState<Auction[]>([]);

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
        const contractAuctions = (await Promise.all(calls)) as Auction[];
        setAuctions(contractAuctions);
      } catch (error) {
        console.log(error);
      }
    };

    setup();
  }, [contract]);

  return (
    <div>
      {auctions.map((auction) => {
        return (
          <Card shadow="sm">
            <span>{auction.auctionName}</span>
            <p>
              HighestBid: {ethers.utils.formatEther(auction.currentHighestBid.price)} by{" "}
              {auction.currentHighestBid.user}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
