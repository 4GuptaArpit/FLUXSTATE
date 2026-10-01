// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title FluxFundingEngine
 * @notice Mathematical block-by-block continuous funding rate engine.
 * @dev Continuous index prevents frontrunning and aligns longs/shorts with 1s Monad finality.
 */
contract FluxFundingEngine {
    uint256 public constant PRECISION = 1e18;
    int256 public constant MAX_BLOCK_FUNDING_RATE = 5e13; // Max 0.005% per 1-second block (clamped)
    uint256 public constant VIRTUAL_OI_FLOOR = 50_000 * 1e18; // ,000 floor eliminates division by zero

    int256 public cumulativeFundingIndex;
    uint256 public lastFundingBlock;
    int256 public baseRatePerBlock = 5e11; // Base coefficient

    address public marketContract;

    event FundingCheckpointed(uint256 indexed blockNumber, int256 cumulativeIndex, int256 ratePerBlock);

    modifier onlyMarket() {
        require(msg.sender == marketContract, "Only market authorized");
        _;
    }

    constructor() {
        lastFundingBlock = block.number;
    }

    function setMarketContract(address _market) external {
        require(marketContract == address(0), "Already configured");
        marketContract = _market;
    }

    function updateFundingIndex(uint256 totalLongs, uint256 totalShorts) external onlyMarket returns (int256) {
        uint256 blocksElapsed = block.number - lastFundingBlock;
        if (blocksElapsed == 0) {
            return cumulativeFundingIndex;
        }

        uint256 totalOI = totalLongs + totalShorts;
        uint256 denominator = totalOI > VIRTUAL_OI_FLOOR ? totalOI : VIRTUAL_OI_FLOOR;

        // Skew calculation: (Longs - Shorts) / Total
        int256 skew = (int256(totalLongs) - int256(totalShorts)) * int256(PRECISION) / int256(denominator);

        int256 ratePerBlock = (skew * baseRatePerBlock) / int256(PRECISION);
        if (ratePerBlock > MAX_BLOCK_FUNDING_RATE) ratePerBlock = MAX_BLOCK_FUNDING_RATE;
        if (ratePerBlock < -MAX_BLOCK_FUNDING_RATE) ratePerBlock = -MAX_BLOCK_FUNDING_RATE;

        cumulativeFundingIndex += ratePerBlock * int256(blocksElapsed);
        lastFundingBlock = block.number;

        emit FundingCheckpointed(block.number, cumulativeFundingIndex, ratePerBlock);
        return cumulativeFundingIndex;
    }

    function computeFundingDue(
        bool isLong,
        uint256 size,
        int256 entryIndex,
        int256 currentIndex
    ) external pure returns (int256) {
        int256 delta = currentIndex - entryIndex;
        if (isLong) {
            return (int256(size) * delta) / int256(PRECISION);
        } else {
            return -(int256(size) * delta) / int256(PRECISION);
        }
    }
}
