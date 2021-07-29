//SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

// TODO: nonReentrant for getBunny?
// TODO: prevent contract from buying?
contract CryptoBunny is ERC721, ERC721Enumerable, Ownable {
  uint256 private MAX_SUPPLY = 10000;
  string private _symbol = unicode"β";
  string private _name = "CryptoBunny";
  uint8 private _decimals = 18;

  string private _baseTokenURI;

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
  Status public saleStatus = Status.Invalid;
  // Invalid = deployed, Open = Sale, Sold = ended

  event BunnyMinted(address owner, uint256 bunnyIndex);
  event BunnySale(uint256 bunnyIndex, uint256 amount);
  event RemoveSale(uint256 bunnyIndex);
  event BunnyBid(uint256 bunnyIndex, address bidder, uint256 amount);
  event AcceptBid(uint256 bunnyIndex, address bidder, uint256 amount);
  event WithdrawBid(uint256 bunnyIndex, address bidder, uint256 amount);
  event BidOverride(uint256 bunnyIndex, uint256 prev, uint256 amount);

  modifier isGamesBegin() {
    require(totalSupply() == MAX_SUPPLY, "All bunnies have to be claimed first");
    _;
  }

  modifier isBunnyRange(uint256 _bunnyIndex) {
    require(_bunnyIndex >= 1 && _bunnyIndex <= MAX_SUPPLY, "bunnyIndex out of range");
    _;
  }

  modifier isBunnyOwner(uint256 _bunnyIndex) {
    require(ownerOf(_bunnyIndex) == msg.sender, "Not bunny owner");
    _;
  }

  modifier isBunnySale(uint256 _bunnyIndex) {
    require(bunnyOffer[_bunnyIndex].status == Status.Open, "Bunny is not on sale");
    _;
  }

  constructor() ERC721(_name, _symbol) {
    _baseTokenURI = "";
  }

  function getBunny(uint256 _bunnyIndex) external isBunnyRange(_bunnyIndex) {
    require(totalSupply() + 1 <= MAX_SUPPLY, "Max Bunnies minted");
    require(ownerOf(_bunnyIndex) == address(0), "Bunny has already been claimed");
    _safeMint(msg.sender, _bunnyIndex);
    emit BunnyMinted(msg.sender, _bunnyIndex);
  }

  function bunniesRemaining() external view returns (uint256) {
    return MAX_SUPPLY - totalSupply();
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

    bunnyBids[_bunnyIndex] = Bid({bunnyIndex: _bunnyIndex, bidder: address(0), price: 0, valid: false});
    bunnyOffer[_bunnyIndex] = Offer({
      minPrice: 0,
      timeCreated: 0,
      status: Status.Withdrawn,
      selectedBidder: address(0)
    });

    emit RemoveSale(_bunnyIndex);
  }

  function bidBunny(uint256 _bunnyIndex) external payable isBunnyRange(_bunnyIndex) {
    require(msg.value > 0, "Amount must be a positive value");
    require(ownerOf(_bunnyIndex) != msg.sender, "You cannot bid for your own bunny");
    require(bunnyOffer[_bunnyIndex].selectedBidder == address(0), "Owner has already selected a winning bid");
    require(
      bunnyBids[_bunnyIndex].price < msg.value && bunnyOffer[_bunnyIndex].minPrice < msg.value,
      "Your bid must be more than previous bid or minPrice"
    );

    pendingWithdrawals[bunnyBids[_bunnyIndex].bidder] += bunnyBids[_bunnyIndex].price;
    bunnyBids[_bunnyIndex] = Bid({bunnyIndex: _bunnyIndex, bidder: msg.sender, price: msg.value, valid: true});
    emit BunnyBid(_bunnyIndex, msg.sender, msg.value);
  }

  // TODO: if someone bid, and you accept. CHECK
  function acceptBid(uint256 _bunnyIndex)
    external
    isBunnyRange(_bunnyIndex)
    isBunnyOwner(_bunnyIndex)
    isBunnySale(_bunnyIndex)
  {
    require(bunnyBids[_bunnyIndex].bidder != address(0), "No bidder for bunny");

    safeTransferFrom(msg.sender, bunnyBids[_bunnyIndex].bidder, _bunnyIndex);

    pendingWithdrawals[msg.sender] += bunnyBids[_bunnyIndex].price;
    emit AcceptBid(_bunnyIndex, bunnyBids[_bunnyIndex].bidder, bunnyBids[_bunnyIndex].price);

    bunnyBids[_bunnyIndex] = Bid({bunnyIndex: _bunnyIndex, bidder: address(0), price: 0, valid: false});
    bunnyOffer[_bunnyIndex] = Offer({minPrice: 0, timeCreated: 0, status: Status.Sold, selectedBidder: address(0)});
  }

  // allow user to buy Bunny provided if Bunny is on sale + NO bids has been done
  function buyBunny(uint256 _bunnyIndex) external payable isBunnyRange(_bunnyIndex) isBunnySale(_bunnyIndex) {
    require(bunnyBids[_bunnyIndex].bidder == address(0), "Please bid");
    require(msg.value >= bunnyOffer[_bunnyIndex].minPrice, "Please offer minPrice");

    address seller = ownerOf(_bunnyIndex);
    bunnyBids[_bunnyIndex] = Bid({bunnyIndex: _bunnyIndex, bidder: address(0), price: 0, valid: false});
    bunnyOffer[_bunnyIndex] = Offer({minPrice: 0, timeCreated: 0, status: Status.Sold, selectedBidder: address(0)});

    safeTransferFrom(seller, msg.sender, _bunnyIndex);
    pendingWithdrawals[seller] += msg.value;
  }

  function withdrawBid(uint256 _bunnyIndex) external isGamesBegin isBunnyRange(_bunnyIndex) {
    require(msg.sender == bunnyBids[_bunnyIndex].bidder, "Not bidder");
    require(msg.sender != ownerOf(_bunnyIndex), "You are the owner");

    pendingWithdrawals[msg.sender] += bunnyBids[_bunnyIndex].price;
    bunnyBids[_bunnyIndex] = Bid({bunnyIndex: _bunnyIndex, bidder: address(0), price: 0, valid: false});
    emit WithdrawBid(_bunnyIndex, msg.sender, bunnyBids[_bunnyIndex].price);
  }

  function withdrawPending() external {
    require(pendingWithdrawals[msg.sender] > 0, "No valid withdrawals");
    uint256 _amount = pendingWithdrawals[msg.sender];
    pendingWithdrawals[msg.sender] = 0;
    (bool success, ) = msg.sender.call{value: _amount}("");
    require(success, "Transfer failed.");
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return _baseTokenURI;
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 tokenId
  ) internal virtual override(ERC721, ERC721Enumerable) {
    super._beforeTokenTransfer(from, to, tokenId);
  }

  function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC721Enumerable) returns (bool) {
    return super.supportsInterface(interfaceId);
  }

  function setBaseURI(string memory baseURI) external onlyOwner {
    _baseTokenURI = baseURI;
  }
}
