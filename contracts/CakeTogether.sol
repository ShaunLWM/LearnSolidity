//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract CakeTogether is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public currentRoundId;
    address public poolAddress;
    IERC20 public token;

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

    mapping(uint256 => Round) private _rounds;

    // keep track of user's contribution per round
    mapping(address => mapping(uint256 => uint256))
        private _userContributionsPerRoundId;

    modifier nonContract() {
        require(!_isContract(msg.sender), "Contract not allowed");
        require(msg.sender == tx.origin, "Proxy contract not allowed");
        _;
    }

    event onDeposit(uint256 roundId, address player, uint256 amount);
    event onDraw();

    constructor(address _token, address _poolAddress) {
        poolAddress = _poolAddress;
        token = IERC20(_token);
        token.approve(_poolAddress, type(uint256).max);
    }

    function changePoolAddress(address _poolAddress) external onlyOwner {
        poolAddress = _poolAddress;
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
        }
        return currentRoundId;
    }

    function deposit(uint256 _roundId, uint256 _amount)
        external
        payable
        nonContract
        nonReentrant
    {
        require(_rounds[_roundId].status == Status.Open, "Round is not Open");
        require(_amount > 0, "Deposit must be more than 0");
        require(_amount % 1 == 0, "Amount must be a whole number");

        token.safeTransferFrom(address(msg.sender), address(this), _amount);
        _rounds[_roundId].amountCollected += _amount;
        _userContributionsPerRoundId[msg.sender][_roundId] += _amount;

        // TODO: deposit in Cake Pool
        emit onDeposit(_roundId, msg.sender, _amount);
    }

    function _isContract(address _addr) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(_addr)
        }
        return size > 0;
    }
}
