// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "../interfaces/IPyth.sol";

library PythDecoder {
    function parsePythPrice(
        IPyth pyth,
        bytes32 priceFeedId,
        uint256 maxStaleness
    ) internal view returns (uint256) {
        IPythStructs.Price memory p = pyth.getPriceNoOlderThan(priceFeedId, maxStaleness);
        require(p.price > 0, "Non-positive oracle price");

        uint256 absPrice = uint256(int256(p.price));
        if (p.expo >= 0) {
            return absPrice * (10 ** uint256(int256(p.expo))) * 1e18;
        } else {
            uint256 divisor = 10 ** uint256(int256(-p.expo));
            return (absPrice * 1e18) / divisor;
        }
    }
}
