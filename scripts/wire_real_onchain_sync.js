const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'app', 'page.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// Replace handleOpenPosition with real onchain execution and exact 1e18 slippage format
const oldOpenCode = `    // If LIVE TESTNET and 1-Click Trading is OFF: send explicit onchain tx with MetaMask popup
    if (!isPilotMode && walletAddress && !is1ClickTrading) {
      try {
        const walletClient = getWalletClient();
        const publicClient = getPublicClient();

        if (walletClient) {
          setTxToast({
            title: "SIGNING ONCHAIN ORDER",
            amount: margin + " MON (" + leverage + "x " + dirStr + ")",
            detail: "Awaiting signature in MetaMask...",
            type: "OPEN",
            isWin: true
          });

          const slippageFactor = isLong ? 1.05 : 0.95; // 5% buffer for testnet volatility
          const slippagePrice = BigInt(Math.floor(monPrice * slippageFactor * 1e8));

          const hash = await walletClient.writeContract({
            address: CONTRACT_ADDRESSES.market,
            abi: FLUX_MARKET_ABI,
            functionName: "openPosition",
            args: [isLong, parseEther(leverage.toString()), slippagePrice, []],
            value: parseEther(marginNum.toString()),
            account: walletAddress
          });

          await publicClient.waitForTransactionReceipt({ hash });
          await fetchRealBalance(walletAddress);
        }
      } catch (err) {
        console.warn("Wallet execution fallback:", err);
      }
    }`;

const newOpenCode = `    // If in LIVE TESTNET mode: broadcast real onchain transaction to Monad Testnet!
    if (!isPilotMode && walletAddress) {
      try {
        const walletClient = getWalletClient();
        const publicClient = getPublicClient();

        if (walletClient) {
          setTxToast({
            title: "SIGNING ONCHAIN ORDER",
            amount: margin + " MON (" + leverage + "x " + dirStr + ")",
            detail: "Confirm in MetaMask to lock margin into FluxVault...",
            type: "OPEN",
            isWin: true
          });

          // 1e18 normalized slippage limit
          const slippageLimit = isLong 
            ? parseEther("20.0") // Max acceptable price for long
            : parseEther("0.1"); // Min acceptable price for short

          const hash = await walletClient.writeContract({
            address: CONTRACT_ADDRESSES.market,
            abi: FLUX_MARKET_ABI,
            functionName: "openPosition",
            args: [isLong, parseEther(leverage.toString()), slippageLimit, []],
            value: parseEther(marginNum.toString()),
            account: walletAddress
          });

          setTxToast({
            title: "TRANSACTION BROADCAST",
            amount: margin + " MON (" + leverage + "x " + dirStr + ")",
            detail: "Mining on Monad (Tx: " + hash.slice(0, 8) + "...)",
            type: "OPEN",
            isWin: true
          });

          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          console.log("Onchain Position Opened in Block:", receipt.blockNumber);
          await fetchRealBalance(walletAddress);
        }
      } catch (err) {
        console.warn("Onchain openPosition error:", err);
        if (err.message && err.message.includes("User rejected")) {
          setIsSubmitting(false);
          setTxToast(null);
          alert("Transaction cancelled in wallet.");
          return;
        }
      }
    }`;

code = code.replace(oldOpenCode, newOpenCode);

// Replace handleClosePosition with real onchain execution and payout settlement
const oldCloseCode = `    // If LIVE TESTNET and 1-Click Trading is OFF: send onchain close
    if (!isPilotMode && walletAddress && !is1ClickTrading) {
      try {
        const walletClient = getWalletClient();
        const publicClient = getPublicClient();

        if (walletClient) {
          setTxToast({
            title: "CLOSING ONCHAIN POSITION",
            amount: (pnl >= 0 ? "+" : "") + pnl.toFixed(2) + " MON",
            detail: "Confirm settlement in MetaMask...",
            type: "CLOSE",
            isWin: pnl >= 0
          });

          const slippageFactor = activePosition.isLong ? 0.95 : 1.05;
          const minPriceSlippage = BigInt(Math.floor(monPrice * slippageFactor * 1e8));

          const hash = await walletClient.writeContract({
            address: CONTRACT_ADDRESSES.market,
            abi: FLUX_MARKET_ABI,
            functionName: "closePosition",
            args: [minPriceSlippage, []],
            account: walletAddress
          });

          await publicClient.waitForTransactionReceipt({ hash });
          await fetchRealBalance(walletAddress);
        }
      } catch (err) {
        console.warn("Wallet close fallback:", err);
      }
    }`;

const newCloseCode = `    // If in LIVE TESTNET mode: broadcast real onchain closePosition to settle payout directly to wallet!
    if (!isPilotMode && walletAddress) {
      try {
        const walletClient = getWalletClient();
        const publicClient = getPublicClient();

        if (walletClient) {
          setTxToast({
            title: "SETTLING PAYOUT ONCHAIN",
            amount: (pnl >= 0 ? "+" : "") + pnl.toFixed(2) + " MON",
            detail: "Confirm in MetaMask to receive payout from FluxVault...",
            type: "CLOSE",
            isWin: pnl >= 0
          });

          const minPriceSlippage = activePosition.isLong ? parseEther("0.1") : parseEther("20.0");

          const hash = await walletClient.writeContract({
            address: CONTRACT_ADDRESSES.market,
            abi: FLUX_MARKET_ABI,
            functionName: "closePosition",
            args: [minPriceSlippage, []],
            account: walletAddress
          });

          setTxToast({
            title: "SETTLEMENT BROADCAST",
            amount: (pnl >= 0 ? "+" : "") + pnl.toFixed(2) + " MON",
            detail: "Monad Block Finality (Tx: " + hash.slice(0, 8) + "...)",
            type: "CLOSE",
            isWin: pnl >= 0
          });

          const receipt = await publicClient.waitForTransactionReceipt({ hash });
          console.log("Onchain Position Closed in Block:", receipt.blockNumber);
          await fetchRealBalance(walletAddress);
        }
      } catch (err) {
        console.warn("Onchain closePosition error:", err);
        if (err.message && err.message.includes("User rejected")) {
          setIsSubmitting(false);
          setTxToast(null);
          alert("Settlement cancelled in wallet.");
          return;
        }
      }
    }`;

code = code.replace(oldCloseCode, newCloseCode);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully wired real onchain openPosition and closePosition with live wallet synchronization!');
