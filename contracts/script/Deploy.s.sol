// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Script.sol";
import "../src/FluxMarket.sol";
import "../src/engines/FluxFundingEngine.sol";
import "../src/core/FluxVault.sol";
import "../src/MockPriceOracle.sol";

/**
 * @title DeployFluxState
 * @notice Complete, verifiable deployment pipeline for FluxState on Monad Testnet (Chain ID 10143).
 * Binds Vault, Funding Engine, and Market with zero frontrunning risk.
 */
contract DeployFluxState is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy or resolve Pyth Oracle
        // Pyth Contract on Monad Testnet or local Mock
        address pythOracle = 0xc547C6f06495690cEd525EDd8Eaf4C17484b0C39;
        bytes32 priceFeedId = 0x0000000000000000000000000000000000000000000000000000000000000001;

        // 2. Deploy Continuous Funding Engine
        FluxFundingEngine fundingEngine = new FluxFundingEngine();

        // 3. Deploy Multi-Asset Liquidity Vault
        FluxVault vault = new FluxVault();

        // 4. Deploy 16-Shard Parallel Market Engine
        FluxMarket market = new FluxMarket(
            pythOracle,
            priceFeedId,
            address(fundingEngine),
            payable(address(vault))
        );

        // 5. Secure Access Control & Authorizations
        fundingEngine.setMarketContract(address(market));
        vault.setMarket(address(market));

        // 6. Seed Vault with Initial Reserve Liquidity
        if (deployer.balance >= 10 ether) {
            (bool success, ) = payable(address(vault)).call{value: 5 ether}("");
            require(success, "Failed to seed initial vault reserve");
        }

        vm.stopBroadcast();

        console.log("=========================================");
        console.log("FLUXSTATE DEPLOYMENT MANIFEST (MONAD T1)");
        console.log("=========================================");
        console.log("Funding Engine :", address(fundingEngine));
        console.log("Flux Vault     :", address(vault));
        console.log("Flux Market    :", address(market));
        console.log("Pyth Oracle    :", pythOracle);
        console.log("=========================================");
    }
}
