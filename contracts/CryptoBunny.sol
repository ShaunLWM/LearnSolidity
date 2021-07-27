//SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// TODO: nonReentrant for getBunny?
// TODO: prevent contract from buying?

contract CryptoBunny is Ownable {
	uint256 private _totalSupply = 10000;
	string private _symbol = "BNY";
	string private _name = "CryptoBunny";
	uint8 private _decimals = 18;

	uint256 public bunniesRemaining;
	mapping(uint256 => address) public bunnyToAddress;
	mapping(address => uint256) public balanceOf;

	enum Status {
		Invalid,
		Open,
		Withdrawn,
		AwaitingWithdrawal,
		Sold
	}

	struct Offer {
		uint256 minPrice;
		uint256 timeCreated;
		Status status;
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
	event WithdrawBid(uint256 bunnyIndex, address bidder, uint256 _amount);
	event TransferOwnership(uint256 _bunnyIndex, address from, address to);

	modifier isGamesBegin() {
		require(bunniesRemaining == 0, "All bunnies have to be claimed first");
		_;
	}

	modifier isBunnyRange(uint256 _bunnyIndex) {
		require(_bunnyIndex >= 1 && _bunnyIndex <= _totalSupply, "bunnyIndex out of range");
		_;
	}

	modifier isBunnyOwner(uint256 _bunnyIndex) {
		require(bunnyToAddress[_bunnyIndex] == msg.sender, "Not bunny owner");
		_;
	}

	modifier isBunnySale(uint256 _bunnyIndex) {
		require(bunnyOffer[_bunnyIndex].status == Status.Open, "Bunny is not on sale");
		_;
	}

	constructor() {
		bunniesRemaining = _totalSupply;
	}

	// USED FOR TESTING PURPOSES ONLY
	function setBunniesRemaining(uint256 value) external onlyOwner {
		bunniesRemaining = value;
	}

	function getBunny(uint256 _bunnyIndex) external isBunnyRange(_bunnyIndex) {
		require(bunnyToAddress[_bunnyIndex] == address(0), "Bunny has already been claimed");
		require(bunniesRemaining > 0, "No more bunnies left");
		bunnyToAddress[_bunnyIndex] = msg.sender;
		bunniesRemaining--;
		balanceOf[msg.sender] += 1;
		emit BunnyMinted(msg.sender, _bunnyIndex);
	}

	function offerBunnyForSale(uint256 _bunnyIndex, uint256 _amount)
		external
		isGamesBegin
		isBunnyRange(_bunnyIndex)
		isBunnyOwner(_bunnyIndex)
	{
		require(
			bunnyOffer[_bunnyIndex].status == Status.Invalid ||
				bunnyOffer[_bunnyIndex].status == Status.Withdrawn ||
				bunnyOffer[_bunnyIndex].status == Status.Sold,
			"Bunny is already on sale"
		);
		require(_amount > 0, "Amount must be a positive value");

		bunnyOffer[_bunnyIndex] = Offer({
			minPrice: _amount,
			timeCreated: block.timestamp,
			status: Status.Open,
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
		if (bunnyBids[_bunnyIndex].bidder != address(0)) {
			pendingWithdrawals[bunnyBids[_bunnyIndex].bidder] += bunnyBids[_bunnyIndex].price;
		}

		bunnyBids[_bunnyIndex] = Bid({ bunnyIndex: _bunnyIndex, bidder: address(0), price: 0, valid: false });
		bunnyOffer[_bunnyIndex] = Offer({
			minPrice: 0,
			timeCreated: 0,
			status: Status.Withdrawn,
			selectedBidder: address(0)
		});

		emit RemoveSale(_bunnyIndex);
	}

	function bidBunny(uint256 _bunnyIndex) external payable isBunnyRange(_bunnyIndex) isBunnySale(_bunnyIndex) {
		require(msg.value > 0, "Amount must be a positive value");
		require(bunnyToAddress[_bunnyIndex] != msg.sender, "You cannot bid for your own bunny");
		require(bunnyOffer[_bunnyIndex].selectedBidder == address(0), "Owner has already selected a winning bid");
		require(
			bunnyBids[_bunnyIndex].price < msg.value && bunnyOffer[_bunnyIndex].minPrice < msg.value,
			"Your bid must be more than previous bid or minPrice"
		);

		pendingWithdrawals[bunnyBids[_bunnyIndex].bidder] += bunnyBids[_bunnyIndex].price;
		bunnyBids[_bunnyIndex] = Bid({ bunnyIndex: _bunnyIndex, bidder: msg.sender, price: msg.value, valid: true });
		emit BunnyBid(_bunnyIndex, msg.sender, msg.value);
	}

	function acceptBid(uint256 _bunnyIndex)
		external
		isGamesBegin
		isBunnyRange(_bunnyIndex)
		isBunnyOwner(_bunnyIndex)
		isBunnySale(_bunnyIndex)
	{
		require(bunnyBids[_bunnyIndex].bidder != address(0), "No bidder for bunny");

		bunnyToAddress[_bunnyIndex] = bunnyBids[_bunnyIndex].bidder;
		emit TransferOwnership(_bunnyIndex, msg.sender, bunnyBids[_bunnyIndex].bidder);

		balanceOf[bunnyBids[_bunnyIndex].bidder] += 1;
		balanceOf[msg.sender] -= 1;
		pendingWithdrawals[msg.sender] += bunnyBids[_bunnyIndex].price;
		emit AcceptBid(_bunnyIndex, bunnyBids[_bunnyIndex].bidder, bunnyBids[_bunnyIndex].price);

		bunnyBids[_bunnyIndex] = Bid({ bunnyIndex: _bunnyIndex, bidder: address(0), price: 0, valid: false });
		bunnyOffer[_bunnyIndex] = Offer({ minPrice: 0, timeCreated: 0, status: Status.Sold, selectedBidder: address(0) });
	}

	// allow user to buy Bunny provided if Bunny is on sale + NO bids has been done
	function buyBunny(uint256 _bunnyIndex)
		external
		payable
		isGamesBegin
		isBunnyRange(_bunnyIndex)
		isBunnySale(_bunnyIndex)
	{
		require(bunnyBids[_bunnyIndex].bidder == address(0), "Please bid");
		require(msg.value >= bunnyOffer[_bunnyIndex].minPrice, "Please offer minPrice");

		address seller = bunnyToAddress[_bunnyIndex];
		bunnyBids[_bunnyIndex] = Bid({ bunnyIndex: _bunnyIndex, bidder: address(0), price: 0, valid: false });
		bunnyOffer[_bunnyIndex] = Offer({ minPrice: 0, timeCreated: 0, status: Status.Sold, selectedBidder: address(0) });

		bunnyToAddress[_bunnyIndex] = msg.sender;
		pendingWithdrawals[seller] += msg.value;
		balanceOf[msg.sender] += 1;
		balanceOf[seller] -= 1;
		emit TransferOwnership(_bunnyIndex, seller, msg.sender);
	}

	function withdrawBid(uint256 _bunnyIndex) external isGamesBegin isBunnyRange(_bunnyIndex) {
		require(msg.sender == bunnyBids[_bunnyIndex].bidder, "Not bidder");
		require(msg.sender != bunnyToAddress[_bunnyIndex], "You are the owner");

		pendingWithdrawals[msg.sender] += bunnyBids[_bunnyIndex].price;
		bunnyBids[_bunnyIndex] = Bid({ bunnyIndex: _bunnyIndex, bidder: address(0), price: 0, valid: false });
		emit WithdrawBid(_bunnyIndex, msg.sender, bunnyBids[_bunnyIndex].price);
	}

	function withdrawPending() external {
		require(pendingWithdrawals[msg.sender] > 0, "No valid withdrawals");
		uint256 _amount = pendingWithdrawals[msg.sender];
		pendingWithdrawals[msg.sender] = 0;
		(bool success, ) = msg.sender.call{ value: _amount }("");
		require(success, "Transfer failed.");
	}
}
