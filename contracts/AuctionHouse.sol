//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "hardhat/console.sol";

contract AuctionHouse is Ownable, ReentrancyGuard {
    event AuctionCreated(uint256 id);
    event NewBid(uint256 auctionId, address indexed user, uint256 bidId);

    struct Auction {
        string auctionName;
        uint256 timeCreated;
        uint256 timeStart;
        uint256 timeEnd;
        address createdBy;
        uint256 bidCount;
        Bid currentHighestBid;
        mapping(uint256 => Bid) bids;
    }

    struct Bid {
        uint256 bidTime;
        uint256 price;
        address user;
    }

    uint256 public currentAuctionId;
    mapping(uint256 => Auction) public auctions;
    uint256 public constant MIN_LENGTH_AUCTION = 1 hours; // 4 hours
    uint256 public constant MAX_LENGTH_AUCTION = 7 days; // 4 days

    constructor() {}

    function newAuction(
        string memory auctionName,
        uint256 timeStart,
        uint256 timeEnd,
        uint256 basePrice
    ) external nonReentrant {
        require(timeStart < timeEnd, "timeEnd must be more than timeStart");
        require(
            ((timeEnd - block.timestamp) > MIN_LENGTH_AUCTION) &&
                ((timeEnd - block.timestamp) < MAX_LENGTH_AUCTION),
            "Aunction length outside of range"
        );
        currentAuctionId += 1;
        Auction storage a = auctions[currentAuctionId];
        a.auctionName = auctionName;
        a.timeCreated = block.timestamp;
        a.timeStart = timeStart;
        a.timeEnd = timeEnd;
        a.createdBy = msg.sender;
        a.bidCount = 0;
        a.currentHighestBid = Bid({
            bidTime: 0,
            price: basePrice,
            user: msg.sender
        });

        emit AuctionCreated(currentAuctionId);
    }

    function addBid(uint256 auctionId, uint256 price) external {
        require(auctions[auctionId].timeStart > 0, "Auction does not exist");
        require(
            block.timestamp >= auctions[auctionId].timeStart,
            "Auction has not started"
        );

        require(
            block.timestamp < auctions[auctionId].timeEnd,
            "Auction has already ended"
        );

        require(
            auctions[auctionId].currentHighestBid.price < price,
            "Your bid price must be higher than current highest bid price."
        );

        uint256 bidCount = auctions[auctionId].bidCount;
        Bid memory newBit = Bid({
            bidTime: block.timestamp,
            price: price,
            user: msg.sender
        });

        auctions[auctionId].bids[bidCount + 1] = newBit;
        auctions[auctionId].bidCount += 1;
        auctions[auctionId].currentHighestBid = newBit;
        emit NewBid(auctionId, msg.sender, bidCount);
    }
}
