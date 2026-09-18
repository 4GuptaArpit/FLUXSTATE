// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MockPriceOracle
 * @notice High-frequency push oracle compatible with Pyth price feed interface semantics.
 * @dev Optimized for sub-second / 1-second price updates on high-throughput chains like Monad.
 */
contract MockPriceOracle {
    struct PriceData {
        int64 price;
        uint64 conf;
        int32 expo;
        uint256 publishTime;
    }

    address public owner;
    mapping(bytes32 => PriceData) private _prices;

    event PriceFeedUpdated(bytes32 indexed id, int64 price, uint256 publishTime);

    modifier onlyOwner() {
        require(msg.sender == owner, "MockPriceOracle: caller is not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setPrice(bytes32 id, int64 price, int32 expo) external onlyOwner {
        _prices[id] = PriceData({
            price: price,
            conf: 1000,
            expo: expo,
            publishTime: block.timestamp
        });
        emit PriceFeedUpdated(id, price, block.timestamp);
    }

    function getPrice(bytes32 id) external view returns (int64 price, int32 expo, uint256 publishTime) {
        PriceData memory data = _prices[id];
        require(data.publishTime > 0, "MockPriceOracle: price not set");
        return (data.price, data.expo, data.publishTime);
    }
}
