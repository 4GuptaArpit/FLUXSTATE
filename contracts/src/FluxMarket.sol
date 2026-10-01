// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./engines/ShardedAccumulator.sol";
import "./engines/FluxFundingEngine.sol";
import "./core/FluxVault.sol";
import "./libraries/PythDecoder.sol";
import "./interfaces/IPyth.sol";

/**
 * @title FluxMarket
 * @author FluxState Team
 * @notice S-Tier Monad-Native Sub-Second Perpetuals Engine with Block-by-Block Funding.
 * @dev Trades touch ONLY trader-isolated shards (zero Block-STM storage collisions).
 */
contract FluxMarket is ShardedAccumulator {
    using PythDecoder for IPyth;

    struct Position {
        uint128 margin;
        uint128 size;
        uint128 entryPrice;
        int128 entryFundingIndex;
        uint32 lastUpdatedBlock;
        bool isLong;
        bool isActive;
    }

    uint256 public constant MAX_LEVERAGE = 50 * 1e18; // 50x
    uint256 public constant MIN_LEVERAGE = 11 * 1e17; // 1.1x
    uint256 public constant MAINTENANCE_MARGIN_BPS = 200; // 2.0% MMR
    uint256 public constant PROTOCOL_FEE_BPS = 8; // 0.08% fee
    uint256 public constant MAX_PRICE_STALENESS = 5; // 5s max staleness

    IPyth public immutable pyth;
    bytes32 public immutable priceFeedId;
    FluxFundingEngine public immutable fundingEngine;
    FluxVault public immutable vault;

    mapping(address => Position) public positions;

    event PositionOpened(
        address indexed trader,
        bool isLong,
        uint128 margin,
        uint128 size,
        uint128 entryPrice,
        int128 entryFundingIndex,
        uint8 shardId
    );
    event PositionClosed(
        address indexed trader,
        uint128 exitPrice,
        int256 pricePnL,
        int256 fundingSettled,
        uint256 payoutToTrader
    );
    event PositionLiquidated(
        address indexed trader,
        address indexed liquidator,
        uint256 liquidationPrice,
        uint256 keeperBounty
    );

    constructor(
        address _pyth,
        bytes32 _priceFeedId,
        address _fundingEngine,
        address payable _vault
    ) {
        pyth = IPyth(_pyth);
        priceFeedId = _priceFeedId;
        fundingEngine = FluxFundingEngine(_fundingEngine);
        vault = FluxVault(_vault);
    }

    function openPosition(
        bool isLong,
        uint256 leverage,
        uint256 maxPriceSlippage,
        bytes[] calldata pythPriceUpdate
    ) external payable {
        Position storage pos = positions[msg.sender];
        require(!pos.isActive, "Position already active");
        require(leverage >= MIN_LEVERAGE && leverage <= MAX_LEVERAGE, "Invalid leverage");
        require(msg.value >= 1e16, "Minimum margin 0.01 MON");

        _updatePythPrice(pythPriceUpdate);
        uint256 currentPrice = pyth.parsePythPrice(priceFeedId, MAX_PRICE_STALENESS);

        if (isLong) {
            require(currentPrice <= maxPriceSlippage, "Slippage exceeded: price too high");
        } else {
            require(currentPrice >= maxPriceSlippage, "Slippage exceeded: price too low");
        }

        int256 currentIndex = fundingEngine.cumulativeFundingIndex();

        uint128 notionalSize = uint128((msg.value * leverage) / 1e18);
        uint128 fee = uint128((uint256(notionalSize) * PROTOCOL_FEE_BPS) / 10000);
        uint128 netMargin = uint128(msg.value) - fee;

        vault.depositCollateral{value: netMargin}(msg.sender);
        vault.allocateProtocolFee{value: fee}();

        uint8 shard = _modifyShardOI(msg.sender, isLong, notionalSize, true);

        positions[msg.sender] = Position({
            margin: netMargin,
            size: notionalSize,
            entryPrice: uint128(currentPrice),
            entryFundingIndex: int128(currentIndex),
            lastUpdatedBlock: uint32(block.number),
            isLong: isLong,
            isActive: true
        });

        emit PositionOpened(msg.sender, isLong, netMargin, notionalSize, uint128(currentPrice), int128(currentIndex), shard);
    }

    function closePosition(
        uint256 minPriceSlippage,
        bytes[] calldata pythPriceUpdate
    ) external payable {
        Position memory pos = positions[msg.sender];
        require(pos.isActive, "No active position");

        _updatePythPrice(pythPriceUpdate);
        uint256 exitPrice = pyth.parsePythPrice(priceFeedId, MAX_PRICE_STALENESS);

        if (pos.isLong) {
            require(exitPrice >= minPriceSlippage, "Slippage: exit price below limit");
        } else {
            require(exitPrice <= minPriceSlippage, "Slippage: exit price above limit");
        }

        int256 currentIndex = fundingEngine.cumulativeFundingIndex();

        int256 pricePnL;
        if (pos.isLong) {
            pricePnL = (int256(uint256(pos.size)) * (int256(exitPrice) - int256(uint256(pos.entryPrice)))) / int256(uint256(pos.entryPrice));
        } else {
            pricePnL = (int256(uint256(pos.size)) * (int256(uint256(pos.entryPrice)) - int256(exitPrice))) / int256(uint256(pos.entryPrice));
        }

        int256 fundingDue = fundingEngine.computeFundingDue(pos.isLong, pos.size, pos.entryFundingIndex, currentIndex);
        int256 netSettlement = int256(uint256(pos.margin)) + pricePnL - fundingDue;
        uint256 traderPayout = netSettlement > 0 ? uint256(netSettlement) : 0;

        _modifyShardOI(msg.sender, pos.isLong, pos.size, false);
        delete positions[msg.sender];

        vault.settleTraderPayout(msg.sender, traderPayout, pos.margin);

        emit PositionClosed(msg.sender, uint128(exitPrice), pricePnL, fundingDue, traderPayout);
    }

    function liquidate(address trader, bytes[] calldata pythPriceUpdate) external payable {
        Position memory pos = positions[trader];
        require(pos.isActive, "No active position");

        _updatePythPrice(pythPriceUpdate);
        uint256 currentPrice = pyth.parsePythPrice(priceFeedId, MAX_PRICE_STALENESS);
        int256 currentIndex = fundingEngine.cumulativeFundingIndex();

        int256 pricePnL = pos.isLong
            ? (int256(uint256(pos.size)) * (int256(currentPrice) - int256(uint256(pos.entryPrice)))) / int256(uint256(pos.entryPrice))
            : (int256(uint256(pos.size)) * (int256(uint256(pos.entryPrice)) - int256(currentPrice))) / int256(uint256(pos.entryPrice));

        int256 fundingDue = fundingEngine.computeFundingDue(pos.isLong, pos.size, pos.entryFundingIndex, currentIndex);
        int256 remainingEquity = int256(uint256(pos.margin)) + pricePnL - fundingDue;

        uint256 requiredMM = (uint256(pos.size) * MAINTENANCE_MARGIN_BPS) / 10000;
        require(remainingEquity < int256(requiredMM), "Position healthy");

        _modifyShardOI(trader, pos.isLong, pos.size, false);
        delete positions[trader];

        uint256 keeperBounty;
        int256 underwaterLoss = 0;

        if (remainingEquity > 0) {
            uint256 standardBounty = (uint256(pos.size) * 50) / 10000;
            if (standardBounty < 1e16) standardBounty = 1e16;
            keeperBounty = standardBounty < uint256(remainingEquity) ? standardBounty : uint256(remainingEquity);
        } else {
            keeperBounty = 1e16; // 0.01 MON fixed bounty from insurance fund
            underwaterLoss = -remainingEquity;
        }

        vault.settleLiquidation(msg.sender, keeperBounty, pos.margin, underwaterLoss);

        emit PositionLiquidated(trader, msg.sender, currentPrice, keeperBounty);
    }

    uint256 public lastCheckpointBlock;
    
    function checkpointFundingRate() external {
        require(block.number > lastCheckpointBlock, "Already checkpointed this block");
        lastCheckpointBlock = block.number;
        (uint256 totalLongs, uint256 totalShorts) = aggregateTotalOI();
        fundingEngine.updateFundingIndex(totalLongs, totalShorts);
    }

    function _updatePythPrice(bytes[] calldata pythPriceUpdate) internal {
        if (pythPriceUpdate.length == 0) return;
        uint256 fee = pyth.getUpdateFee(pythPriceUpdate);
        require(msg.value >= fee, "Insufficient Pyth fee");
        pyth.updatePriceFeeds{value: fee}(pythPriceUpdate);
    }
}
