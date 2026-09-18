// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./MockPriceOracle.sol";

/**
 * @title FluxMarket
 * @author FluxState Team
 * @notice High-Frequency Parallelized Micro-Prediction Market built natively for Monad.
 * @dev Storage slots are isolated per (epoch, direction, user) to maximize parallel EVM execution efficiency.
 */
contract FluxMarket {
    enum Direction { UP, DOWN }

    struct Epoch {
        uint256 startTimestamp;
        uint256 lockTimestamp;
        uint256 closeTimestamp;
        int64 lockPrice;
        int64 closePrice;
        uint256 totalUpAmount;
        uint256 totalDownAmount;
        bool resolved;
        Direction winningDirection;
    }

    struct Position {
        uint256 amount;
        bool claimed;
    }

    // Immutable configuration
    address public immutable owner;
    MockPriceOracle public immutable oracle;
    bytes32 public immutable feedId;
    uint256 public immutable roundDuration; // e.g. 5 seconds or 15 seconds

    uint256 public currentEpochId;

    // Epoch storage: isolated state mapping
    mapping(uint256 => Epoch) public epochs;

    // Parallel partitioned user positions: epochs[epochId].userPositions[user][direction]
    // Distinct storage slots prevent EVM write-lock collisions on parallel transaction runs
    mapping(uint256 => mapping(address => mapping(Direction => Position))) public positions;

    // Events for live WebSocket / UI sub-second rendering
    event RoundStarted(uint256 indexed epochId, uint256 startTimestamp, uint256 lockTimestamp, uint256 closeTimestamp);
    event BetPlaced(uint256 indexed epochId, address indexed user, Direction direction, uint256 amount);
    event RoundLocked(uint256 indexed epochId, int64 lockPrice);
    event RoundResolved(uint256 indexed epochId, int64 closePrice, Direction winningDirection);
    event RewardClaimed(uint256 indexed epochId, address indexed user, uint256 payout);

    modifier onlyOwner() {
        require(msg.sender == owner, "FluxMarket: caller is not owner");
        _;
    }

    constructor(address _oracleAddress, bytes32 _feedId, uint256 _roundDuration) {
        require(_oracleAddress != address(0), "Invalid oracle address");
        require(_roundDuration >= 2, "Duration too short");

        owner = msg.sender;
        oracle = MockPriceOracle(_oracleAddress);
        feedId = _feedId;
        roundDuration = _roundDuration;
    }

    /**
     * @notice Starts a new micro-round.
     */
    function startRound() external onlyOwner {
        currentEpochId++;
        uint256 nowTs = block.timestamp;

        epochs[currentEpochId] = Epoch({
            startTimestamp: nowTs,
            lockTimestamp: nowTs + roundDuration,
            closeTimestamp: nowTs + (roundDuration * 2),
            lockPrice: 0,
            closePrice: 0,
            totalUpAmount: 0,
            totalDownAmount: 0,
            resolved: false,
            winningDirection: Direction.UP
        });

        emit RoundStarted(currentEpochId, nowTs, nowTs + roundDuration, nowTs + (roundDuration * 2));
    }

    /**
     * @notice Places a high-frequency directional micro-bet.
     * @dev Each user transaction touches isolated storage slots: positions[epochId][msg.sender][direction]
     */
    function placeBet(uint256 epochId, Direction direction) external payable {
        require(msg.value > 0, "Bet amount must be > 0");
        Epoch storage epoch = epochs[epochId];
        require(block.timestamp < epoch.lockTimestamp, "Round betting locked");

        if (direction == Direction.UP) {
            epoch.totalUpAmount += msg.value;
        } else {
            epoch.totalDownAmount += msg.value;
        }

        Position storage pos = positions[epochId][msg.sender][direction];
        pos.amount += msg.value;

        emit BetPlaced(epochId, msg.sender, direction, msg.value);
    }

    /**
     * @notice Locks price at the end of the betting window.
     */
    function lockRound(uint256 epochId) external onlyOwner {
        Epoch storage epoch = epochs[epochId];
        require(!epoch.resolved, "Already resolved");
        require(block.timestamp >= epoch.lockTimestamp, "Not yet lockable");
        require(epoch.lockPrice == 0, "Already locked");

        (int64 price,,) = oracle.getPrice(feedId);
        epoch.lockPrice = price;

        emit RoundLocked(epochId, price);
    }

    /**
     * @notice Resolves the round once the closeTimestamp has passed.
     */
    function resolveRound(uint256 epochId) external onlyOwner {
        Epoch storage epoch = epochs[epochId];
        require(!epoch.resolved, "Round already resolved");
        require(block.timestamp >= epoch.closeTimestamp, "Round close time not reached");
        require(epoch.lockPrice != 0, "Round was not locked");

        (int64 price,,) = oracle.getPrice(feedId);
        epoch.closePrice = price;
        epoch.resolved = true;

        if (price >= epoch.lockPrice) {
            epoch.winningDirection = Direction.UP;
        } else {
            epoch.winningDirection = Direction.DOWN;
        }

        emit RoundResolved(epochId, price, epoch.winningDirection);
    }

    /**
     * @notice Claims winnings for a resolved round.
     */
    function claimReward(uint256 epochId) external {
        Epoch memory epoch = epochs[epochId];
        require(epoch.resolved, "Round not resolved yet");

        Direction winner = epoch.winningDirection;
        Position storage pos = positions[epochId][msg.sender][winner];
        require(!pos.claimed, "Reward already claimed");
        require(pos.amount > 0, "No winning bet found");

        pos.claimed = true;

        uint256 winningPool = winner == Direction.UP ? epoch.totalUpAmount : epoch.totalDownAmount;
        uint256 totalPool = epoch.totalUpAmount + epoch.totalDownAmount;

        // Proportional payout: (userBet / winningPool) * totalPool
        uint256 payout = (pos.amount * totalPool) / winningPool;

        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "Payout transfer failed");

        emit RewardClaimed(epochId, msg.sender, payout);
    }
}
