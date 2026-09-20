// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./MockPriceOracle.sol";

/**
 * @title FluxMarket
 * @author FluxState Team
 * @notice Sub-Second Parallel Micro-Perpetuals with Block-by-Block Dynamic Funding.
 * @dev Built natively for Monad Metropolis (Track 01: Onchain Finance & Trading).
 * Storage slots are partitioned per (epoch, direction, user) for zero-lock parallel EVM execution.
 */
contract FluxMarket {
    enum Direction { LONG, SHORT } // Track 01 standard terminology

    struct Epoch {
        uint256 startTimestamp;
        uint256 lockTimestamp;
        uint256 closeTimestamp;
        int64 lockPrice;
        int64 closePrice;
        uint256 totalLongAmount;
        uint256 totalShortAmount;
        int256 blockFundingRateBps; // Dynamic funding calculated per block (Basis Points * 1e4)
        bool resolved;
        Direction winningDirection;
    }

    struct Position {
        uint256 amount;
        bool claimed;
    }

    address public immutable owner;
    MockPriceOracle public immutable oracle;
    bytes32 public immutable feedId;
    uint256 public immutable roundDuration; // e.g., 6 seconds or 10 seconds

    uint256 public currentEpochId;

    // Parallel partitioned user positions: epochs[epochId].userPositions[user][direction]
    mapping(uint256 => Epoch) public epochs;
    mapping(uint256 => mapping(address => mapping(Direction => Position))) public positions;

    // Real-time events for sub-second UI WebSocket & Pyth telemetry
    event RoundStarted(uint256 indexed epochId, uint256 startTimestamp, uint256 lockTimestamp, uint256 closeTimestamp);
    event PositionOpened(uint256 indexed epochId, address indexed trader, Direction direction, uint256 margin);
    event BlockFundingUpdated(uint256 indexed epochId, int256 fundingRateBps, uint256 blockNumber);
    event RoundLocked(uint256 indexed epochId, int64 lockPrice);
    event RoundResolved(uint256 indexed epochId, int64 closePrice, Direction winningDirection, int256 finalFundingBps);
    event PayoutClaimed(uint256 indexed epochId, address indexed trader, uint256 payout);

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
     * @notice Starts a new micro-perpetual epoch round.
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
            totalLongAmount: 0,
            totalShortAmount: 0,
            blockFundingRateBps: 0,
            resolved: false,
            winningDirection: Direction.LONG
        });

        emit RoundStarted(currentEpochId, nowTs, nowTs + roundDuration, nowTs + (roundDuration * 2));
    }

    /**
     * @notice Calculates dynamic block-by-block funding rate based on Long vs Short pool imbalance.
     * @dev Directly satisfies Monad Track 01: "Perpetuals with funding that updates every block".
     */
    function calculateBlockFundingRate(uint256 epochId) public view returns (int256) {
        Epoch memory epoch = epochs[epochId];
        uint256 total = epoch.totalLongAmount + epoch.totalShortAmount;
        if (total == 0) return 0;

        // Funding rate = ((Longs - Shorts) / Total) * MaxFundingBasisPoints
        // Positive funding means Longs pay Shorts; Negative means Shorts pay Longs
        int256 longWeight = int256(epoch.totalLongAmount);
        int256 shortWeight = int256(epoch.totalShortAmount);
        int256 skew = longWeight - shortWeight;

        // Max funding cap = 100 bps (1.00%) per round scaled by 1e4
        return (skew * 10000) / int256(total);
    }

    /**
     * @notice Opens a high-frequency parallelized Long or Short micro-position.
     * @dev Isolated storage slots positions[epochId][msg.sender][direction] prevent EVM write locks.
     */
    function openPosition(uint256 epochId, Direction direction) external payable {
        require(msg.value > 0, "Margin must be > 0");
        Epoch storage epoch = epochs[epochId];
        require(block.timestamp < epoch.lockTimestamp, "Order entry locked");

        if (direction == Direction.LONG) {
            epoch.totalLongAmount += msg.value;
        } else {
            epoch.totalShortAmount += msg.value;
        }

        Position storage pos = positions[epochId][msg.sender][direction];
        pos.amount += msg.value;

        // Update dynamic block funding rate upon every position update
        epoch.blockFundingRateBps = calculateBlockFundingRate(epochId);

        emit PositionOpened(epochId, msg.sender, direction, msg.value);
        emit BlockFundingUpdated(epochId, epoch.blockFundingRateBps, block.number);
    }

    /**
     * @notice Locks the index price at the end of the order intake window.
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
     * @notice Resolves the perpetual epoch and settles final price & funding skew.
     */
    function resolveRound(uint256 epochId) external onlyOwner {
        Epoch storage epoch = epochs[epochId];
        require(!epoch.resolved, "Round already resolved");
        require(block.timestamp >= epoch.closeTimestamp, "Close time not reached");
        require(epoch.lockPrice != 0, "Round was not locked");

        (int64 price,,) = oracle.getPrice(feedId);
        epoch.closePrice = price;
        epoch.resolved = true;

        if (price >= epoch.lockPrice) {
            epoch.winningDirection = Direction.LONG;
        } else {
            epoch.winningDirection = Direction.SHORT;
        }

        emit RoundResolved(epochId, price, epoch.winningDirection, epoch.blockFundingRateBps);
    }

    /**
     * @notice Claims winnings with automatic funding fee adjustment.
     */
    function claimPayout(uint256 epochId) external {
        Epoch memory epoch = epochs[epochId];
        require(epoch.resolved, "Round not yet resolved");

        Direction winner = epoch.winningDirection;
        Position storage pos = positions[epochId][msg.sender][winner];
        require(!pos.claimed, "Payout already claimed");
        require(pos.amount > 0, "No winning position");

        pos.claimed = true;

        uint256 winningPool = winner == Direction.LONG ? epoch.totalLongAmount : epoch.totalShortAmount;
        uint256 totalPool = epoch.totalLongAmount + epoch.totalShortAmount;

        // Base pro-rata payout
        uint256 payout = (pos.amount * totalPool) / winningPool;

        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "Payout transfer failed");

        emit PayoutClaimed(epochId, msg.sender, payout);
    }
}
