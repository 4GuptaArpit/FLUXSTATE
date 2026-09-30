// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "./interfaces/IPyth.sol";

contract MockPriceOracle is IPyth {
    int64 private _price = 428500000; // .285 (8 decimals)
    int32 private _expo = -8;

    function setPrice(int64 newPrice, int32 newExpo) external {
        _price = newPrice;
        _expo = newExpo;
    }

    function getPriceNoOlderThan(bytes32, uint256) external view override returns (Price memory price) {
        return Price({
            price: _price,
            conf: 1000,
            expo: _expo,
            publishTime: block.timestamp
        });
    }

    function getUpdateFee(bytes[] calldata) external pure override returns (uint256) {
        return 0;
    }

    function updatePriceFeeds(bytes[] calldata) external payable override {}
}
