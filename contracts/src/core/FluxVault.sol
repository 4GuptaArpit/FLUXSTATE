// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FluxVault
 * @notice Multi-Asset LP Liquidity Vault & Bad-Debt Insurance Fund.
 * Supports native MON as primary collateral with sub-second payout settlement.
 */
contract FluxVault is Ownable {
    address public market;

    uint256 public totalDepositedCollateral;
    uint256 public poolReserves;
    uint256 public insuranceReserve;

    uint256 public constant INSURANCE_FEE_SPLIT_BPS = 2000; // 20% of protocol fees to insurance fund

    event CollateralDeposited(address indexed trader, uint256 amount);
    event PayoutSettled(address indexed trader, uint256 payout, int256 netProfit);
    event BadDebtAbsorbed(uint256 badDebtAmount, uint256 insuranceUsed);

    modifier onlyMarket() {
        require(msg.sender == market, "Caller is not market");
        _;
    }

    constructor() Ownable(msg.sender) {}

    function setMarket(address _market) external onlyOwner {
        require(market == address(0), "Market already set");
        market = _market;
    }

    receive() external payable {
        poolReserves += msg.value;
    }

    function depositCollateral(address trader) external payable onlyMarket {
        totalDepositedCollateral += msg.value;
        emit CollateralDeposited(trader, msg.value);
    }

    function settleTraderPayout(
        address trader,
        uint256 payout,
        uint256 originalMargin
    ) external onlyMarket {
        totalDepositedCollateral -= originalMargin;

        if (payout > originalMargin) {
            uint256 profit = payout - originalMargin;
            require(address(this).balance >= payout, "Vault reserve liquidity insufficient");
            poolReserves = poolReserves >= profit ? poolReserves - profit : 0;
            (bool s, ) = payable(trader).call{value: payout}("");
            require(s, "Payout transfer failed");
            emit PayoutSettled(trader, payout, int256(profit));
        } else {
            uint256 loss = originalMargin - payout;
            poolReserves += loss;
            if (payout > 0) {
                (bool s, ) = payable(trader).call{value: payout}("");
                require(s, "Partial return transfer failed");
            }
            emit PayoutSettled(trader, payout, -int256(loss));
        }
    }

    function settleLiquidation(
        address keeper,
        uint256 keeperBounty,
        uint256 originalMargin,
        int256 underwaterLoss
    ) external onlyMarket {
        totalDepositedCollateral -= originalMargin;

        if (underwaterLoss > 0) {
            uint256 badDebt = uint256(underwaterLoss);
            if (insuranceReserve >= badDebt) {
                insuranceReserve -= badDebt;
            } else {
                uint256 remainingBadDebt = badDebt - insuranceReserve;
                insuranceReserve = 0;
                poolReserves = poolReserves >= remainingBadDebt ? poolReserves - remainingBadDebt : 0;
            }
            emit BadDebtAbsorbed(badDebt, insuranceReserve);
        } else {
            uint256 surplus = originalMargin > keeperBounty ? originalMargin - keeperBounty : 0;
            poolReserves += surplus;
        }

        if (keeperBounty > 0) {
            (bool s, ) = payable(keeper).call{value: keeperBounty}("");
            require(s, "Keeper bounty transfer failed");
        }
    }

    function allocateProtocolFee() external payable onlyMarket {
        uint256 toInsurance = (msg.value * INSURANCE_FEE_SPLIT_BPS) / 10000;
        uint256 toLP = msg.value - toInsurance;
        insuranceReserve += toInsurance;
        poolReserves += toLP;
    }
}
