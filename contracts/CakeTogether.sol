//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./SortitionSumTreeFactory.sol";
import "./strategies/pancakeswap/IMasterChef.sol";

// import "hardhat/console.sol";

interface ITicket is IERC20 {
    function mint(address to, uint256 amount) external;

    function addMinter(address owner) external;

    function removeMinter(address owner) external;
}

contract CakeTogether is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    using SortitionSumTreeFactory for SortitionSumTreeFactory.SortitionSumTrees;
    SortitionSumTreeFactory.SortitionSumTrees internal _sumTreeFactory;

    uint256 public currentRoundId;
    IMasterChef public poolAddress;
    IERC20 public token;
    ITicket public ticket;

    enum Status {
        Pending,
        Open,
        Close,
        Claimable
    }

    struct Round {
        Status status;
        uint256 startTime;
        uint256 endTime;
        uint256 amountCollected;
        uint256 startTicketId;
        uint256 endTicketId;
        uint256 tickerNumber;
    }

    struct TicketRange {
        uint256 start;
        uint256 end;
    }

    bytes32 private constant _TREE_KEY = keccak256("CakeTogether/Ticket");
    uint256 private constant _MAX_TREE_LEAVES = 5;

    mapping(uint256 => Round) private _rounds;

    // keep track of user's contribution per round
    mapping(address => mapping(uint256 => TicketRange[]))
        private _userContributionsPerRoundId;

    modifier nonContract() {
        require(!_isContract(msg.sender), "Contract not allowed");
        require(msg.sender == tx.origin, "Proxy contract not allowed");
        _;
    }

    event onDeposit(uint256 roundId, address player, uint256 amount);
    event onDraw();

    constructor(
        address _token,
        address _poolAddress,
        address _ticket
    ) {
        poolAddress = IMasterChef(_poolAddress);
        token = IERC20(_token);
        token.approve(_poolAddress, type(uint256).max);
        _sumTreeFactory.createTree(_TREE_KEY, _MAX_TREE_LEAVES);
        ticket = ITicket(_ticket);
    }

    function changePoolAddress(address _poolAddress) external onlyOwner {
        poolAddress = IMasterChef(_poolAddress);
    }

    function createRound() external onlyOwner returns (uint256) {
        currentRoundId += 1;
        Round storage r = _rounds[currentRoundId];
        r.status = Status.Open;
        r.startTime = block.timestamp;
        r.endTime = block.timestamp + 7 days;
        if (currentRoundId > 1) {
            // if round is 2 and onwards, we set current startTicketId to previous end + 1;
            r.startTicketId = _rounds[currentRoundId - 1].endTicketId + 1;
        } else if (currentRoundId == 1) {
            r.startTicketId = 1;
        }

        // TODO: emit
        return currentRoundId;
    }

    function deposit(uint256 _roundId, uint256 _amount)
        external
        nonContract
        nonReentrant
    {
        require(_rounds[_roundId].status == Status.Open, "Round is not Open");
        require(_amount > 0, "Deposit must be more than 0");
        require(_amount % 1 == 0, "Amount must be a whole number");

        uint256 allowance = token.allowance(msg.sender, address(this));
        require(allowance >= _amount, "Check the token allowance");

        token.safeTransferFrom(address(msg.sender), address(this), _amount);
        TicketRange memory userTicketRange = TicketRange({
            start: _rounds[_roundId].endTicketId + 1,
            end: _rounds[_roundId].endTicketId + _amount
        });

        _userContributionsPerRoundId[msg.sender][_roundId].push(
            userTicketRange
        );

        _rounds[_roundId].amountCollected += _amount;
        _rounds[_roundId].endTicketId = _rounds[_roundId].endTicketId + _amount;
        ticket.mint(msg.sender, _amount);
        poolAddress.enterStaking(_amount);

        // TODO: deposit in Cake Pool
        // TODO: give user xCake
        emit onDeposit(_roundId, msg.sender, _amount);
    }

    function getRound(uint256 _roundId) external view returns (Round memory) {
        return _rounds[_roundId];
    }

    function _isContract(address _addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(_addr)
        }
        return size > 0;
    }
}
