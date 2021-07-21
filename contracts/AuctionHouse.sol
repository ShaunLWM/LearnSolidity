//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

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
        uint256 basePrice;
        Bid currentHighestBid;
    }

    struct Bid {
        uint256 bidTime;
        uint256 price;
        address user;
    }

    uint256 public currentAuctionId;
    mapping(uint256 => Auction) public auctions;
    uint256 public constant MIN_LENGTH_AUCTION = 1 hours; // 1 hour
    uint256 public constant MAX_LENGTH_AUCTION = 7 days; // 7 days
    uint256 public minAuctionStartBid = 1 gwei;

    mapping(address => uint256) pendingWithdraws;

    constructor() {}

    function newAuction(
        string memory auctionName,
        uint256 timeStart,
        uint256 timeEnd,
        uint256 amount
    ) external nonReentrant {
        require(timeStart < timeEnd, "timeEnd must be more than timeStart");
        require(
            ((timeEnd - timeStart) >= MIN_LENGTH_AUCTION) &&
                ((timeEnd - timeStart) < MAX_LENGTH_AUCTION),
            "Aunction length outside of range"
        );
        require(
            amount >= minAuctionStartBid,
            "Auction must be more than minAuctionStartBid"
        );

        currentAuctionId += 1;
        Auction storage a = auctions[currentAuctionId];
        a.auctionName = auctionName;
        a.timeCreated = block.timestamp;
        a.timeStart = timeStart;
        a.timeEnd = timeEnd;
        a.createdBy = msg.sender;
        a.bidCount = 0;
        a.basePrice = amount;

        emit AuctionCreated(currentAuctionId);
    }

    function addBid(uint256 auctionId) external payable {
        require(auctions[auctionId].timeStart > 0, "Auction does not exist");

        Auction storage currentAuction = auctions[auctionId];

        require(
            currentAuction.createdBy != msg.sender,
            "Creator cannot bid own auction"
        );

        require(
            block.timestamp >= currentAuction.timeStart,
            "Auction has not started"
        );

        require(
            block.timestamp < currentAuction.timeEnd,
            "Auction has already ended"
        );

        require(
            msg.value > currentAuction.basePrice &&
                msg.value > currentAuction.currentHighestBid.price,
            "Your bid price must be higher than current highest bid price"
        );

        if (currentAuction.bidCount > 0) {
            pendingWithdraws[
                currentAuction.currentHighestBid.user
            ] += currentAuction.currentHighestBid.price;
        }

        Bid memory newBit = Bid({
            bidTime: block.timestamp,
            price: msg.value,
            user: msg.sender
        });

        currentAuction.bidCount += 1;
        currentAuction.currentHighestBid = newBit;

        emit NewBid(auctionId, msg.sender, currentAuction.bidCount);
    }

    function withdraw() external {
        require(pendingWithdraws[msg.sender] > 0, "No withdraws");
        uint256 amount = pendingWithdraws[msg.sender];
        pendingWithdraws[msg.sender] = 0;

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed.");
        pendingWithdraws[msg.sender] = amount;
    }
}
