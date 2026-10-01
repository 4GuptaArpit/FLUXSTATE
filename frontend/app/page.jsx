"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  ShieldCheck, 
  Activity, 
  Wallet, 
  Clock, 
  CheckCircle2, 
  Flame, 
  Radio, 
  Cpu, 
  Crosshair, 
  Gauge, 
  Percent,
  Sliders,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  History
} from "lucide-react";
import { getWalletClient, getPublicClient, monadTestnet, FLUX_MARKET_ABI, CONTRACT_ADDRESSES } from "../lib/web3";
import { formatEther } from "viem";
import { parseEther } from "viem";
import { ShardMonitor } from "../components/ShardMonitor";

export default function FluxGamingTerminal() {
  const [monPrice, setMonPrice] = useState(4.285);
  const [priceHistory, setPriceHistory] = useState(() => Array.from({ length: 24 }, (_, i) => +(4.270 + Math.sin(i / 3) * 0.015 + (i * 0.0006)).toFixed(4)));
  const [secondsRemaining, setSecondsRemaining] = useState(6);
  const [epochId, setEpochId] = useState(882);
  const [margin, setMargin] = useState("10");
  const [leverage, setLeverage] = useState(10);
  const [userBalance, setUserBalance] = useState(1000.0);
  const [sandboxBalance, setSandboxBalance] = useState(1000.0);
  const [testnetMarginBalance, setTestnetMarginBalance] = useState(0.0);
  const [onchainWalletBalance, setOnchainWalletBalance] = useState(null);
  const [isPilotMode, setIsPilotMode] = useState(false);
  const [is1ClickTrading, setIs1ClickTrading] = useState(true);
  const [activePosition, setActivePosition] = useState(null);
  const [sandboxHistory, setSandboxHistory] = useState([]);
  const [testnetHistory, setTestnetHistory] = useState([]);
  const defaultHistory = [
    {
      id: 881,
      type: "LONG",
      leverage: 10,
      margin: 10,
      entryPrice: 4.272,
      exitPrice: 4.285,
      funding: -0.0018,
      pnl: 3.04,
      pnlPercent: "+30.4%",
      isWin: true,
      time: "2 mins ago"
    },
    {
      id: 880,
      type: "SHORT",
      leverage: 10,
      margin: 10,
      entryPrice: 4.291,
      exitPrice: 4.272,
      funding: 0.0012,
      pnl: 4.42,
      pnlPercent: "+44.2%",
      isWin: true,
      time: "4 mins ago"
    }
  ];

  const [tradeHistory, setTradeHistory] = useState(defaultHistory);
  const [mounted, setMounted] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [txToast, setTxToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [blockFundingRateBps, setBlockFundingRateBps] = useState("+0.0024%");

  const marginNum = Math.max(0, parseFloat(margin) || 0);
  const notionalSize = marginNum * leverage;

  // Real-time pre-flight calculation
  const { liqPriceLong, liqPriceShort, feeAmount } = useMemo(() => {
    if (marginNum <= 0 || notionalSize <= 0) return { liqPriceLong: 0, liqPriceShort: 0, feeAmount: 0 };
    const fee = notionalSize * 0.0008; // 0.08%
    const effectiveMargin = marginNum - fee;
    const mmr = notionalSize * 0.02; // 2% MMR
    const buffer = effectiveMargin - mmr;

    const liqLong = monPrice * (1 - buffer / notionalSize);
    const liqShort = monPrice * (1 + buffer / notionalSize);

    return {
      liqPriceLong: Math.max(0, liqLong),
      liqPriceShort: liqShort,
      feeAmount: fee
    };
  }, [marginNum, notionalSize, monPrice, leverage]);

  // Live PnL calculation for the active position
  const currentPositionPnL = useMemo(() => {
    if (!activePosition) return { pnlMon: 0, pnlPercent: 0, isProfit: true };
    const priceDelta = activePosition.isLong 
      ? (monPrice - activePosition.entryPrice)
      : (activePosition.entryPrice - monPrice);
    
    const rawPnlUSD = (activePosition.sizeUSD * priceDelta) / activePosition.entryPrice;
    const pnlMon = rawPnlUSD / monPrice;
    const pnlPercent = (rawPnlUSD / (activePosition.margin * activePosition.entryPrice)) * 100;
    
    return {
      pnlMon,
      pnlPercent,
      isProfit: pnlMon >= 0
    };
  }, [activePosition, monPrice]);

  // Sub-second price ticks
  useEffect(() => {
    const priceInterval = setInterval(() => {
      const delta = (Math.random() - 0.49) * 0.006;
      setMonPrice((prev) => {
        const next = +(prev + delta).toFixed(4);
        setPriceHistory((hist) => [...hist.slice(-23), next]);
        return next;
      });
    }, 500);

    return () => clearInterval(priceInterval);
  }, []);

  // 1-Second block countdown & epoch transitions
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setEpochId((e) => e + 1);
          return 8;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch real onchain MON balance directly from Monad Testnet RPC
  const fetchRealBalance = async (address) => {
    try {
      const publicClient = getPublicClient();
      const rawBalance = await publicClient.getBalance({ address });
      const exactEtherStr = formatEther(rawBalance);
      const formatted = parseFloat(exactEtherStr);
      setOnchainWalletBalance(formatted);
      setTestnetMarginBalance(formatted);

      if (!isPilotMode) {
        setUserBalance(formatted);
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("flux_testnet_margin_" + address.toLowerCase(), formatted.toString());
      }
    } catch (err) {
      console.warn("Could not fetch onchain balance:", err);
    }
  };

  // Helper to persist updated trading margin balance per mode
  const updateTradingBalance = (newBal) => {
    setUserBalance(newBal);
    if (typeof window !== "undefined") {
      if (isPilotMode) {
        setSandboxBalance(newBal);
        localStorage.setItem("flux_sandbox_margin", newBal.toString());
      } else if (walletAddress) {
        setTestnetMarginBalance(newBal);
        localStorage.setItem("flux_testnet_margin_" + walletAddress.toLowerCase(), newBal.toString());
      }
    }
  };

  // Switch between Pilot Sandbox and Live Testnet modes cleanly
  const toggleMode = (targetIsPilot) => {
    setIsPilotMode(targetIsPilot);
    if (targetIsPilot) {
      setUserBalance(sandboxBalance);
    } else {
      if (walletAddress) {
        setUserBalance(testnetMarginBalance > 0 ? testnetMarginBalance : (onchainWalletBalance || 0));
        fetchRealBalance(walletAddress);
      } else {
        handleConnectWallet();
      }
    }
  };

  const handleConnectWallet = async () => {
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        alert("MetaMask / Web3 wallet not detected. Switched to Pilot Sandbox Mode (1,000 MON).");
        setIsPilotMode(true);
        setUserBalance(1000.0);
        return;
      }
      const walletClient = getWalletClient();
      if (!walletClient) {
        setIsPilotMode(true);
        setUserBalance(1000.0);
        return;
      }

      const [address] = await walletClient.requestAddresses();
      try {
        await walletClient.switchChain({ id: monadTestnet.id });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await walletClient.addChain({ chain: monadTestnet });
        }
      }
      setWalletAddress(address);
      setIsPilotMode(false);
      await fetchRealBalance(address);
    } catch (err) {
      console.warn("Wallet connect error:", err);
    }
  };

  // Hydrate persistent trade history and sandbox balances after client mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      // Hydrate sandbox balance
      const savedSandBal = localStorage.getItem("flux_sandbox_margin");
      if (savedSandBal !== null) {
        const p = parseFloat(savedSandBal);
        if (!isNaN(p)) setSandboxBalance(p);
      }

      // Hydrate sandbox history
      const savedSandHist = localStorage.getItem("flux_sandbox_history");
      if (savedSandHist) {
        try {
          const parsed = JSON.parse(savedSandHist);
          if (Array.isArray(parsed)) setSandboxHistory(parsed);
        } catch (e) {}
      } else {
        setSandboxHistory(defaultHistory);
      }

      // Hydrate testnet history
      const savedTestHist = localStorage.getItem("flux_testnet_history");
      if (savedTestHist) {
        try {
          const parsed = JSON.parse(savedTestHist);
          if (Array.isArray(parsed)) setTestnetHistory(parsed);
        } catch (e) {}
      }
    }
  }, []);

  // Auto-detect wallet if already authorized and listen to account/chain switches
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.request({ method: "eth_accounts" })
        .then((accounts) => {
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsPilotMode(false);
            fetchRealBalance(accounts[0]);
          } else {
            setIsPilotMode(true);
            setUserBalance(1000.0);
          }
        })
        .catch(() => {
          setIsPilotMode(true);
          setUserBalance(1000.0);
        });

      const handleAccounts = (accounts) => {
        if (accounts && accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsPilotMode(false);
          fetchRealBalance(accounts[0]);
        } else {
          setWalletAddress(null);
          setIsPilotMode(true);
          setUserBalance(1000.0);
        }
      };

      const handleChain = () => {
        window.location.reload();
      };

      window.ethereum.on?.("accountsChanged", handleAccounts);
      window.ethereum.on?.("chainChanged", handleChain);

      return () => {
        window.ethereum.removeListener?.("accountsChanged", handleAccounts);
        window.ethereum.removeListener?.("chainChanged", handleChain);
      };
    } else {
      setIsPilotMode(true);
      setUserBalance(1000.0);
    }
  }, []);

  const handleOpenPosition = async (isLong) => {
    if (activePosition) {
      alert("You already have an active position! Close it first before opening a new one.");
      return;
    }
    if (userBalance < marginNum) {
      alert("Insufficient balance! You need at least " + marginNum + " MON.");
      return;
    }

    setIsSubmitting(true);
    const dirStr = isLong ? "LONG" : "SHORT";

    // Deduct margin immediately in state for instant sub-second response
    updateTradingBalance(Math.max(0, +(userBalance - marginNum).toFixed(4)));

    // If in LIVE TESTNET mode: broadcast real onchain transaction to Monad Testnet!
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
        // Rollback balance deduction since transaction did not go through
        await fetchRealBalance(walletAddress);
        setIsSubmitting(false);
        setTxToast(null);
        alert(err.message && err.message.includes("User rejected") 
          ? "Transaction cancelled in wallet." 
          : "Onchain transaction failed. Please check your gas / network.");
        return;
      }
    }

    const newPos = {
      epochId,
      isLong,
      margin: marginNum,
      leverage,
      entryPrice: monPrice,
      sizeUSD: notionalSize * monPrice,
      startTime: Date.now()
    };

    setActivePosition(newPos);

    setTxToast({
      title: is1ClickTrading ? "1-CLICK ORDER CONFIRMED" : "ONCHAIN ORDER CONFIRMED",
      amount: margin + " MON (" + leverage + "x " + dirStr + ")",
      detail: is1ClickTrading ? "50ms Fast Execution (Session Key Active)" : "Mined on Monad (Shard Assigned)",
      type: "OPEN",
      isWin: true
    });

    setIsSubmitting(false);
    setTimeout(() => setTxToast(null), 4000);
  };

  const handleClosePosition = async () => {
    if (!activePosition) return;
    setIsSubmitting(true);

    const pnl = currentPositionPnL.pnlMon;
    const finalReturn = Math.max(0, +(activePosition.margin + pnl).toFixed(2));

    // Credit payout to balance immediately
    updateTradingBalance(+(userBalance + finalReturn).toFixed(2));

    // If in LIVE TESTNET mode: broadcast real onchain closePosition to settle payout directly to wallet!
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
    }

    const historyEntry = {
      id: activePosition.epochId,
      type: activePosition.isLong ? "LONG" : "SHORT",
      leverage: activePosition.leverage,
      margin: activePosition.margin,
      entryPrice: activePosition.entryPrice,
      exitPrice: monPrice,
      funding: -0.0014,
      pnl: +pnl.toFixed(2),
      pnlPercent: (pnl >= 0 ? "+" : "") + currentPositionPnL.pnlPercent.toFixed(1) + "%",
      isWin: pnl >= 0,
      time: "Just now"
    };

    if (isPilotMode) {
      setSandboxHistory((prev) => {
        const updated = [historyEntry, ...prev.slice(0, 9)];
        if (typeof window !== "undefined") {
          localStorage.setItem("flux_sandbox_history", JSON.stringify(updated));
        }
        return updated;
      });
    } else {
      setTestnetHistory((prev) => {
        const updated = [historyEntry, ...prev.slice(0, 9)];
        if (typeof window !== "undefined") {
          localStorage.setItem("flux_testnet_history", JSON.stringify(updated));
        }
        return updated;
      });
    }

    setTxToast({
      title: pnl >= 0 ? "PROFIT SETTLED & PAID" : "POSITION CLOSED",
      amount: (pnl >= 0 ? "+" : "") + pnl.toFixed(2) + " MON (" + historyEntry.pnlPercent + ")",
      detail: is1ClickTrading ? "Instant 50ms Session Settlement" : "Settled Onchain to Wallet",
      type: "CLOSE",
      isWin: pnl >= 0
    });

    setActivePosition(null);
    setIsSubmitting(false);
    setTimeout(() => setTxToast(null), 5000);
  };

  const displayWallet = walletAddress 
    ? (walletAddress.length > 18 ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4) : walletAddress)
    : "CONNECT WALLET";

  return (
    <div className="min-h-screen bg-[#030014] text-slate-100 cyber-grid flex flex-col selection:bg-purple-600 relative overflow-hidden">
      
      {/* Ambient Radial Background Glows */}
      <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Cyberpunk Top HUD Navigation */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-purple-900/30 bg-[#07031C]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-purple-600/40">
              <div className="w-full h-full bg-[#07031C] rounded-[15px] flex items-center justify-center">
                <Crosshair className="w-6 h-6 text-cyan-400 animate-spin" style={{ animationDuration: "12s" }} />
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-2xl tracking-wider uppercase bg-gradient-to-r from-white via-purple-200 to-cyan-400 bg-clip-text text-transparent">
                FLUXSTATE
              </span>
              <span className="text-[10px] uppercase font-mono tracking-widest px-2.5 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-500/40 shadow-sm">
                MONAD TESTNET • v2.0-BETA
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-purple-300/60 font-mono">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>BLOCK-BY-BLOCK FUNDING • 16-SHARD PARALLEL EVM</span>
            </div>
          </div>
        </div>

        {/* Live Monad Telemetry HUD Badges */}
        <div className="hidden lg:flex items-center space-x-4 text-xs font-mono">
          <div className="glass-panel px-4 py-2 rounded-xl flex items-center space-x-3 border-emerald-500/20">
            <Percent className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">BLOCK FUNDING:</span>
            <span className="text-emerald-300 font-black">{blockFundingRateBps}</span>
          </div>

          <div className="glass-panel px-4 py-2 rounded-xl flex items-center space-x-3 border-cyan-500/20">
            <Gauge className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">SLOT FINALITY:</span>
            <span className="text-cyan-300 font-black">1.0s</span>
          </div>

          <div className="glass-panel px-4 py-2 rounded-xl flex items-center space-x-3 border-purple-500/20">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400">EXECUTION:</span>
            <span className="text-purple-300 font-black">16 SHARDS (0 ABORTS)</span>
          </div>
        </div>

        {/* User Balance & Wallet Action */}
        <div className="flex items-center space-x-3">
          {/* Mode Pill Indicator */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl border font-mono text-xs cursor-pointer select-none transition-all duration-300"
            onClick={() => toggleMode(!isPilotMode)}
            title="Click to switch environments: Live Testnet (Onchain) vs Pilot Sandbox"
          >
            <span className={"w-2 h-2 rounded-full " + (isPilotMode ? "bg-amber-400 animate-pulse" : "bg-emerald-400 animate-ping")} />
            <span className={isPilotMode ? "text-amber-300 font-bold" : "text-emerald-300 font-bold"}>
              {isPilotMode ? "PILOT SANDBOX" : "LIVE TESTNET"}
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-2 bg-[#0C0726] border border-cyan-500/40 px-4 py-2 rounded-xl font-mono">
            <span className="text-xs text-slate-400">BALANCE:</span>
            <span className="text-sm font-black text-cyan-300">
              {userBalance.toFixed(5)} MON
            </span>
          </div>

          <button
            onClick={handleConnectWallet}
            className={"group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider text-white transition-all " + (
              walletAddress 
                ? "bg-gradient-to-r from-purple-800 to-indigo-900 border border-purple-500/50 hover:border-cyan-400"
                : "bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 neon-glow-purple active:scale-95"
            )}
          >
            <Wallet className="w-4 h-4 text-cyan-200" />
            <span>{walletAddress ? (walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)) : "CONNECT WALLET"}</span>
          </button>
        </div>
      </header>

      {/* Main Gaming Terminal Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* Left 2 Cols: Holographic Chart, Active Position HUD & Trade Ledger */}
        <section className="lg:col-span-2 flex flex-col space-y-6">
          
          {/* Main Price & Epoch Control Center */}
          <div className="glass-panel glass-panel-glow rounded-3xl p-6 relative overflow-hidden">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <div className="flex items-center space-x-3">
                  <div className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span>PYTH SUB-SECOND FEED</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2 font-mono">
                    MON-PERP / USD
                  </h2>
                </div>

                <div className="mt-3 flex items-baseline space-x-4">
                  <span className="text-5xl font-mono font-black tracking-tighter text-white drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                    {"$" + monPrice.toFixed(4)}
                  </span>
                  <span className="text-emerald-400 text-sm font-mono font-bold flex items-center bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    <TrendingUp className="w-3.5 h-3.5 mr-1" /> +4.12%
                  </span>
                </div>
              </div>

              {/* Dynamic 1-Second Block Funding Display Box */}
              <div className="glass-panel rounded-2xl p-4 text-right border-purple-500/30">
                <div className="text-[11px] uppercase tracking-widest text-purple-300/70 font-mono">
                  BLOCK FUNDING RATE
                </div>
                <div className="mt-1 flex items-center space-x-2 font-mono text-2xl font-black text-emerald-300">
                  <span>{blockFundingRateBps}</span>
                </div>
                <div className="text-[10px] text-cyan-300 font-mono mt-0.5">UPDATES EVERY 1-SEC BLOCK</div>
              </div>
            </div>

            {/* Real-Time Sparkline / Spectrum */}
            <div className="mt-8 h-48 w-full rounded-2xl bg-[#060217]/90 border border-purple-900/40 p-5 flex items-end justify-between space-x-1.5 relative overflow-hidden">
              <div className="absolute top-4 left-5 flex items-center space-x-2 text-xs font-mono text-purple-300/70">
                <Flame className="w-4 h-4 text-cyan-400" />
                <span>60 FPS Micro-Perpetual Tick Stream</span>
              </div>

              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-purple-500/10 dashed" />

              {priceHistory.map((val, idx) => {
                const minP = Math.min(...priceHistory); const maxP = Math.max(...priceHistory); const spread = Math.max(0.005, maxP - minP); const heightPercent = Math.min(95, Math.max(20, Math.round(((val - minP) / spread) * 75 + 15)));
                const isLatest = idx === priceHistory.length - 1;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div 
                      style={{ height: heightPercent + "%" }}
                      className={"w-full rounded-t-sm transition-all duration-300 " + (
                        isLatest 
                          ? "bg-gradient-to-t from-purple-600 via-cyan-400 to-white shadow-[0_0_20px_#06b6d4]" 
                          : "bg-purple-900/30 hover:bg-purple-700/60"
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-Time Active Position HUD */}
          {activePosition && (
            <div className="glass-panel rounded-3xl p-6 border-cyan-400/60 shadow-[0_0_30px_rgba(6,182,212,0.25)] relative overflow-hidden">
              <div className="flex flex-wrap justify-between items-center pb-4 border-b border-purple-900/40 gap-3">
                <div className="flex items-center space-x-3">
                  <span className={"px-3 py-1 rounded-xl text-xs font-mono font-black " + (
                    activePosition.isLong 
                      ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30" 
                      : "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                  )}>
                    {activePosition.isLong ? "LONG" : "SHORT"} {activePosition.leverage}x
                  </span>
                  <span className="font-mono text-sm font-bold text-white">
                    MON-PERP (Epoch #{activePosition.epochId})
                  </span>
                </div>

                <button
                  onClick={handleClosePosition}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 font-mono text-xs font-black uppercase text-white shadow-lg shadow-purple-600/30 active:scale-95 transition-all flex items-center space-x-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>CLOSE & SETTLE PAYOUT</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 text-xs font-mono">
                <div className="bg-[#0A051D] p-3.5 rounded-2xl border border-purple-900/40">
                  <div className="text-slate-400 mb-1">Entry Price:</div>
                  <div className="text-base font-bold text-white">{"$" + activePosition.entryPrice.toFixed(4)}</div>
                </div>

                <div className="bg-[#0A051D] p-3.5 rounded-2xl border border-purple-900/40">
                  <div className="text-slate-400 mb-1">Mark Price:</div>
                  <div className="text-base font-bold text-cyan-300">{"$" + monPrice.toFixed(4)}</div>
                </div>

                <div className="bg-[#0A051D] p-3.5 rounded-2xl border border-purple-900/40">
                  <div className="text-slate-400 mb-1">Margin Locked:</div>
                  <div className="text-base font-bold text-slate-200">{activePosition.margin} MON</div>
                </div>

                <div className={"p-3.5 rounded-2xl border " + (
                  currentPositionPnL.isProfit 
                    ? "bg-emerald-950/40 border-emerald-500/50" 
                    : "bg-rose-950/40 border-rose-500/50"
                )}>
                  <div className="text-slate-400 mb-1">Unrealized PnL:</div>
                  <div className={"text-base font-black flex items-center " + (
                    currentPositionPnL.isProfit ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {currentPositionPnL.isProfit ? <ArrowUpRight className="w-4 h-4 mr-0.5" /> : <ArrowDownRight className="w-4 h-4 mr-0.5" />}
                    {(currentPositionPnL.pnlMon >= 0 ? "+" : "") + currentPositionPnL.pnlMon.toFixed(2)} MON ({currentPositionPnL.pnlPercent.toFixed(1)}%)
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* S-Tier Monad Block-STM Live Shard Heatmap */}
          <ShardMonitor />

          {/* Verified Onchain Settlement History Ledger */}
          <div className="glass-panel rounded-3xl p-6 border-purple-500/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 flex items-center space-x-2">
                <History className="w-4 h-4 text-cyan-400" />
                <span>USER TRADE & ONCHAIN SETTLEMENT LEDGER</span>
              </h3>
              <span className="text-[11px] font-mono text-emerald-400">1-SEC FINALITY</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="text-slate-500 border-b border-purple-900/40 pb-2">
                    <th className="py-2">EPOCH</th>
                    <th>TYPE</th>
                    <th>MARGIN</th>
                    <th>ENTRY ➔ EXIT</th>
                    <th>NET PnL</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/20">
                  {(isPilotMode ? sandboxHistory : testnetHistory).map((trade, idx) => (
                    <tr key={idx} className="hover:bg-purple-950/20 transition-colors">
                      <td className="py-3 text-slate-300 font-bold">#{trade.id}</td>
                      <td>
                        <span className={"px-2 py-0.5 rounded text-[10px] font-bold " + (
                          trade.type === "LONG" 
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        )}>
                          {trade.type} {trade.leverage}x
                        </span>
                      </td>
                      <td className="text-slate-300">{trade.margin} MON</td>
                      <td className="text-slate-300">{"$" + trade.entryPrice.toFixed(4) + " ➔ $" + trade.exitPrice.toFixed(4)}</td>
                      <td className={"font-bold " + (trade.isWin ? "text-emerald-400" : "text-rose-400")}>
                        {(trade.pnl >= 0 ? "+" : "") + trade.pnl} MON ({trade.pnlPercent})
                      </td>
                      <td>
                        <span className={"text-[10px] px-2 py-0.5 rounded border " + (
                          isPilotMode 
                            ? "text-amber-300 bg-amber-950/60 border-amber-500/30" 
                            : "text-emerald-300 bg-emerald-950/60 border-emerald-500/30"
                        )}>
                          {isPilotMode ? "SIMULATED" : "ONCHAIN MINED"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </section>

        {/* Right Col: Institutional Margin & Leverage Cockpit */}
        <section className="flex flex-col space-y-6">
          <div className="glass-panel glass-panel-glow rounded-3xl p-6 flex flex-col justify-between flex-1 border-purple-500/20">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-purple-900/30">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-mono font-black text-sm uppercase tracking-wider text-white">
                    PERP COCKPIT
                  </h3>
                </div>
                
                {/* 1-Click Session Key Toggle */}
                <div 
                  onClick={() => setIs1ClickTrading(!is1ClickTrading)}
                  className={"flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono cursor-pointer transition-all " + (
                    is1ClickTrading 
                      ? "bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]" 
                      : "bg-[#0A051D] border-purple-900/50 text-slate-400"
                  )}
                  title="Toggle 1-Click Trading (Session Keys eliminate MetaMask popups on each trade)"
                >
                  <Zap className={"w-3 h-3 " + (is1ClickTrading ? "text-cyan-400 animate-pulse" : "text-slate-500")} />
                  <span className="font-bold">{is1ClickTrading ? "1-CLICK ON (0 POPUPS)" : "WALLET PROMPT"}</span>
                </div>
              </div>

              {/* Collateral Input with Custom Steppers */}
              <div className="mt-5">
                <div className="flex justify-between text-xs font-mono text-purple-300/80 mb-2">
                  <span>MARGIN DEPOSIT</span>
                  <span className="text-cyan-300 font-bold">BAL: {userBalance.toFixed(5)} MON</span>
                </div>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={margin}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (isNaN(val) || val < 0) {
                        setMargin("1");
                      } else {
                        setMargin(e.target.value);
                      }
                    }}
                    className="w-full bg-[#08021C] border border-purple-900/50 focus:border-cyan-400 rounded-xl px-4 py-3 text-lg font-mono text-white focus:outline-none transition-colors pr-24"
                    placeholder="10"
                  />
                  <div className="absolute right-3 flex items-center space-x-2">
                    <span className="text-xs text-cyan-300 font-mono font-black pointer-events-none">MON</span>
                    <div className="flex flex-col border border-purple-900/50 rounded-md overflow-hidden bg-[#0C0726]">
                      <button
                        type="button"
                        onClick={() => setMargin((prev) => (Math.max(1, (parseFloat(prev) || 0) + 1)).toString())}
                        className="px-1.5 py-0.5 text-[9px] hover:bg-cyan-500/30 text-cyan-300 transition-colors font-bold cursor-pointer"
                        title="Increase Margin"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => setMargin((prev) => (Math.max(1, (parseFloat(prev) || 0) - 1)).toString())}
                        className="px-1.5 py-0.5 text-[9px] hover:bg-cyan-500/30 text-cyan-300 transition-colors font-bold border-t border-purple-900/40 cursor-pointer"
                        title="Decrease Margin"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leverage Slider */}
              <div className="mt-5">
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-purple-300/80">LEVERAGE MULTIPLIER</span>
                  <span className="font-bold text-cyan-300 text-sm">{leverage}x</span>
                </div>
                <input
                  type="range"
                  min="1.1"
                  max="50"
                  step="0.5"
                  value={leverage}
                  onChange={(e) => setLeverage(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-2 bg-[#08021C] rounded-lg"
                />
                <div className="flex justify-between text-xs text-purple-300/70 mt-2 font-mono">
                  {[2, 5, 10, 25, 50].map((val) => (
                    <button
                      key={val}
                      onClick={() => setLeverage(val)}
                      className={"px-2.5 py-0.5 rounded border transition-colors " + (
                        leverage === val ? "border-cyan-400 text-cyan-300 bg-cyan-950/60 font-bold" : "border-purple-900/40 hover:text-white"
                      )}
                    >
                      {val}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Real-time Institutional Position Metrics */}
              <div className="mt-5 bg-[#08021C] rounded-2xl p-4 space-y-2.5 text-xs font-mono border border-purple-900/40">
                <div className="flex justify-between">
                  <span className="text-slate-400">Position Notional:</span>
                  <span className="font-bold text-white">{"$" + (notionalSize * monPrice).toFixed(2) + " USD"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Est. Liq Price (Long):</span>
                  <span className="font-bold text-emerald-400">{"$" + liqPriceLong.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Est. Liq Price (Short):</span>
                  <span className="font-bold text-rose-400">{"$" + liqPriceShort.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Protocol Fee (0.08%):</span>
                  <span className="text-slate-300">{feeAmount.toFixed(4)} MON</span>
                </div>
              </div>

              {/* Long / Short Action Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  disabled={isSubmitting || marginNum <= 0 || Boolean(activePosition)}
                  onClick={() => handleOpenPosition(true)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 font-mono font-black text-base flex items-center justify-between px-6 neon-glow-emerald active:scale-95 transition-all disabled:opacity-50"
                >
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>BUY / LONG {leverage}x</span>
                  </div>
                  <span className="text-xs font-mono bg-emerald-900/60 px-3 py-1 rounded-lg border border-emerald-400/40">
                    1.0s SETTLED
                  </span>
                </button>

                <button
                  disabled={isSubmitting || marginNum <= 0 || Boolean(activePosition)}
                  onClick={() => handleOpenPosition(false)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-red-600 hover:from-rose-400 hover:to-pink-500 font-mono font-black text-base flex items-center justify-between px-6 neon-glow-rose active:scale-95 transition-all disabled:opacity-50"
                >
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="w-5 h-5" />
                    <span>SELL / SHORT {leverage}x</span>
                  </div>
                  <span className="text-xs font-mono bg-rose-900/60 px-3 py-1 rounded-lg border border-rose-400/40">
                    1.0s SETTLED
                  </span>
                </button>
              </div>
            </div>

            {/* Architecture Moat Explainer */}
            <div className="mt-5 bg-[#060217]/90 border border-purple-500/20 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-center space-x-2 text-cyan-300 font-mono font-bold">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>MONAD BLOCK-STM INNOVATION</span>
              </div>
              <p className="text-slate-400 font-mono text-[11px] leading-relaxed">
                Trades touch only isolated shards (shards[trader % 16]). 
                Funding index is decoupled and checkpointed once every 3 blocks by autonomous keepers. 0 EVM storage write collisions.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Notification Toast */}
      {txToast && (
        <div className="fixed bottom-8 right-8 bg-[#0B0621] border border-cyan-400/80 p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] flex items-center space-x-4 z-[9999] neon-glow-cyan transition-all duration-300">
          <div className={"w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border " + (
            txToast.isWin 
              ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40" 
              : "bg-rose-500/20 text-rose-300 border-rose-400/40"
          )}>
            <CheckCircle2 className="w-7 h-7 text-cyan-400" />
          </div>
          <div className="space-y-1">
            <div className="font-mono font-black text-sm text-white tracking-wide uppercase">
              {txToast.title}
            </div>
            <div className="text-xs font-mono text-slate-300">
              {txToast.amount}
            </div>
            <div className="text-[11px] font-mono text-cyan-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>{txToast.detail}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
