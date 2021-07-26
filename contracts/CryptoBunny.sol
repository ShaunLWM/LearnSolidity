//SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract CryptoBunny is Ownable {
	// index 0 to 9999 is 10,000 items
	uint256 private _totalSupply = 9999;
	string private _symbol = "BNY";
	string private _name = "CryptoBunny";
	uint8 private _decimals = 18;

	uint256 public bunniesRemaining;
	mapping(uint256 => address) public bunnyToAddress;

	struct Offer {
		address seller; // used to check if bidder = offer owner
		uint256 minPrice;
		uint256 timeCreated;
		bool valid;
		address selectedBidder;
	}

	struct Bid {
		uint256 bunnyIndex;
		address bidder;
		uint256 price;
		bool valid;
	}

	// map bunnyIndex to Offer by owner
	mapping(uint256 => Offer) public bunnyOffer;
	mapping(uint256 => Bid) public bunnyBids;

	mapping(address => uint256) public pendingWithdrawals;

	event BunnyMinted(address owner, uint256 bunnyIndex);
	event BunnySale(uint256 bunnyIndex, uint256 amount);
	event RemoveSale(uint256 bunnyIndex);
	event BunnyBid(uint256 bunnyIndex, address bidder, uint256 _amount);
	event AcceptBid(uint256 bunnyIndex, address bidder, uint256 _amount);
	event TransferOwnership(uint256 _bunnyIndex, address from, address to);

	modifier isBunnyRange(uint256 _bunnyIndex) {
		require(_bunnyIndex >= 0 && _bunnyIndex <= _totalSupply, "bunnyIndex out of range");
		_;
	}

	modifier isBunnyOwner(uint256 _bunnyIndex) {
		require(bunnyToAddress[_bunnyIndex] == msg.sender, "Not bunny owner");
		_;
	}

	modifier isBunnySale(uint256 _bunnyIndex) {
		require(bunnyOffer[_bunnyIndex].valid, "Bunny is not on sale");
		_;
	}

	constructor() {
		// _totalSupply is 9999, but we check if bunniesRemaining > 0
		bunniesRemaining = _totalSupply + 1;
	}

	function getBunny(uint256 _bunnyIndex) public isBunnyRange(_bunnyIndex) {
		require(bunniesRemaining > 0, "No more bunnies left");
		bunnyToAddress[_bunnyIndex] = msg.sender;
		bunniesRemaining--;
		emit BunnyMinted(msg.sender, _bunnyIndex);
	}

	function offerBunnyForSale(uint256 _bunnyIndex, uint256 _amount)
		external
		isBunnyRange(_bunnyIndex)
		isBunnyOwner(_bunnyIndex)
	{
		require(bunniesRemaining == 0, "All bunnies have to be claimed first");
		require(bunnyOffer[_bunnyIndex].minPrice == 0, "Bunny is already on sale");
		require(_amount > 0, "Amount must be a positive value");

		bunnyOffer[_bunnyIndex] = Offer({
			seller: msg.sender,
			minPrice: _amount,
			timeCreated: block.timestamp,
			valid: true,
			selectedBidder: address(0)
		});

		emit BunnySale(_bunnyIndex, _amount);
	}

	function withdrawBunnySale(uint256 _bunnyIndex)
		external
		isBunnyRange(_bunnyIndex)
		isBunnyOwner(_bunnyIndex)
		isBunnySale(_bunnyIndex)
	{
		bunnyBids[_bunnyIndex] = Bid({ bunnyIndex: _bunnyIndex, bidder: address(0), price: 0, valid: false });
		bunnyOffer[_bunnyIndex] = Offer({
			seller: address(0),
			minPrice: 0,
			timeCreated: 0,
			valid: false,
			selectedBidder: address(0)
		});

		emit RemoveSale(_bunnyIndex);
	}

	function bidBunny(uint256 _bunnyIndex, uint256 _amount) external isBunnyRange(_bunnyIndex) isBunnySale(_bunnyIndex) {
		require(_amount > 0, "Amount must be a positive value");
		require(bunnyOffer[_bunnyIndex].seller != msg.sender, "You cannot bid for your own bunny");
		require(bunnyOffer[_bunnyIndex].selectedBidder == address(0), "Owner has already selected a winning bid");
		require(bunnyOffer[_bunnyIndex].minPrice < _amount, "Your bid must be more than minPrice");
		require(bunnyBids[_bunnyIndex].price < _amount, "Your bid must be more than previous bid");

		bunnyBids[_bunnyIndex] = Bid({ bunnyIndex: _bunnyIndex, bidder: msg.sender, price: _amount, valid: true });
		emit BunnyBid(_bunnyIndex, msg.sender, _amount);
	}

	function acceptBid(uint256 _bunnyIndex)
		external
		isBunnyRange(_bunnyIndex)
		isBunnyOwner(_bunnyIndex)
		isBunnySale(_bunnyIndex)
	{
		require(bunnyBids[_bunnyIndex].bidder != address(0), "No bidder for bunny");

		bunnyOffer[_bunnyIndex].selectedBidder = bunnyBids[_bunnyIndex].bidder;
		emit AcceptBid(_bunnyIndex, bunnyBids[_bunnyIndex].bidder, bunnyBids[_bunnyIndex].price);
		// Offer and Bid will still be valid till bidder has BOUGHT the bunny
	}

	// after owner has accepted this bid, user can finally buy and transfer it
	function buyBunny(uint256 _bunnyIndex) external payable isBunnyRange(_bunnyIndex) isBunnySale(_bunnyIndex) {
		require(bunnyOffer[_bunnyIndex].selectedBidder == msg.sender, "Bunny is not sold to you");
		require(bunnyBids[_bunnyIndex].price == msg.value, "Incorrect token amount");

		address seller = bunnyOffer[_bunnyIndex].seller;
		bunnyBids[_bunnyIndex] = Bid({ bunnyIndex: _bunnyIndex, bidder: address(0), price: 0, valid: false });
		bunnyOffer[_bunnyIndex] = Offer({
			seller: address(0),
			minPrice: 0,
			timeCreated: 0,
			valid: false,
			selectedBidder: address(0)
		});

		bunnyToAddress[_bunnyIndex] = msg.sender;
		pendingWithdrawals[seller] += msg.value;
		emit TransferOwnership(_bunnyIndex, seller, msg.sender);
	}

	function withdrawBid() external {}

	function withdrawPending() external {
		require(pendingWithdrawals[msg.sender] > 0, "No valid withdrawals");
		uint256 _amount = pendingWithdrawals[msg.sender];
		pendingWithdrawals[msg.sender] = 0;
		(bool success, ) = msg.sender.call{ value: _amount }("");
		require(success, "Transfer failed.");
	}
}
