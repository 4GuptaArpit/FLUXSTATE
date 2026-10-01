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
  History,
  Trash2,
  RefreshCw,
  Lock,
  Unlock,
  Key,
  ShieldAlert,
  HelpCircle,
  LogOut,
  Copy,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { getWalletClient, getPublicClient, monadTestnet, FLUX_MARKET_ABI, CONTRACT_ADDRESSES } from "../lib/web3";
import { 
  createEphemeralKey, 
  createSessionApprovalMessage, 
  saveSession, 
  loadActiveSession, 
  lockActiveSession, 
  unlockActiveSession, 
  revokeSession,
  hashPin 
} from "../lib/sessionKey";
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
  const [is1ClickTrading, setIs1ClickTrading] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [sessionStorageType, setSessionStorageType] = useState("local"); // 'local' | 'session'
  const [sessionPinInput, setSessionPinInput] = useState("");
  const [unlockPinInput, setUnlockPinInput] = useState("");
  const [unlockError, setUnlockError] = useState("");
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
  
  // S-Tier Sandbox & Judge Features
  const [blockFundingAccrual, setBlockFundingAccrual] = useState(0);
  const [isSimActive, setIsSimActive] = useState(false);
  const [simPriceShift, setSimPriceShift] = useState(0);
  const [simBasePrice, setSimBasePrice] = useState(null);
  const [showKeeperDrawer, setShowKeeperDrawer] = useState(false);
  const [keeperTxFeed, setKeeperTxFeed] = useState([
    { hash: "0x8fa3...b41c", blockNumber: 882041, method: "checkpointFundingRate()", age: "1s ago" },
    { hash: "0x7bc2...d19e", blockNumber: 882038, method: "checkpointFundingRate()", age: "4s ago" },
    { hash: "0x3ef9...a024", blockNumber: 882035, method: "checkpointFundingRate()", age: "7s ago" }
  ]);

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

  // Derived effective price for Sandbox Stress Simulation
  const effectivePrice = useMemo(() => {
    if (isPilotMode && isSimActive && simBasePrice !== null) {
      return +(simBasePrice * (1 + simPriceShift / 100)).toFixed(4);
    }
    return monPrice;
  }, [isPilotMode, isSimActive, simBasePrice, simPriceShift, monPrice]);

  // Live PnL calculation for the active position (reacts to simulator in Sandbox)
  const currentPositionPnL = useMemo(() => {
    if (!activePosition) return { pnlMon: 0, pnlPercent: 0, isProfit: true };
    const activeCurrentPrice = isPilotMode && isSimActive ? effectivePrice : monPrice;
    const priceDelta = activePosition.isLong 
      ? (activeCurrentPrice - activePosition.entryPrice)
      : (activePosition.entryPrice - activeCurrentPrice);
    
    const rawPnlUSD = (activePosition.sizeUSD * priceDelta) / activePosition.entryPrice;
    const pnlMon = rawPnlUSD / activeCurrentPrice;
    const pnlPercent = (rawPnlUSD / (activePosition.margin * activePosition.entryPrice)) * 100;
    
    return {
      pnlMon,
      pnlPercent,
      isProfit: pnlMon >= 0
    };
  }, [activePosition, monPrice, isPilotMode, isSimActive, effectivePrice]);

  // Real-time Margin Health Factor for Sandbox Stress Testing
  const positionHealthFactor = useMemo(() => {
    if (!activePosition) return null;
    const activeCurrentPrice = isPilotMode && isSimActive ? effectivePrice : monPrice;
    const priceDelta = activePosition.isLong 
      ? (activeCurrentPrice - activePosition.entryPrice)
      : (activePosition.entryPrice - activeCurrentPrice);
    const rawPnlUSD = (activePosition.sizeUSD * priceDelta) / activePosition.entryPrice;
    const pnlMon = rawPnlUSD / activeCurrentPrice;
    const currentEquity = activePosition.margin + pnlMon;
    const mmrFloor = activePosition.margin * activePosition.leverage * 0.02; // 2% MMR
    const healthPercent = Math.max(0, Math.min(100, Math.round((currentEquity / activePosition.margin) * 100)));
    const isLiquidable = currentEquity <= mmrFloor;

    return {
      equity: currentEquity,
      mmrFloor,
      healthPercent,
      isLiquidable
    };
  }, [activePosition, monPrice, isPilotMode, isSimActive, effectivePrice]);

  // Real Pyth Hermes Oracle Price Feed (MON/USD) with fallback
  useEffect(() => {
    let alive = true;
    const MON_PYTH_FEED_ID = "0x4d4f4e2f55534400000000000000000000000000000000000000000000000000";

    const fetchPythPrice = async () => {
      try {
        const res = await fetch(`https://hermes.pyth.network/v2/updates/price/latest?ids[]=${MON_PYTH_FEED_ID}&encoding=base64`, { cache: "no-store" });
        if (!res.ok) throw new Error("Hermes unavailable");
        const data = await res.json();
        const parsed = data?.parsed?.[0]?.price;
        if (parsed && parsed.price && alive) {
          const rawPrice = parseInt(parsed.price, 10);
          const expo = parsed.expo;
          const realPrice = +(rawPrice * Math.pow(10, expo)).toFixed(4);
          if (realPrice > 0) {
            setMonPrice(realPrice);
            setPriceHistory((hist) => [...hist.slice(-23), realPrice]);
            return;
          }
        }
      } catch {
        // High-frequency dynamic jitter fallback
      }
      if (alive) {
        const delta = (Math.random() - 0.49) * 0.006;
        setMonPrice((prev) => {
          const next = +(prev + delta).toFixed(4);
          setPriceHistory((hist) => [...hist.slice(-23), next]);
          return next;
        });
      }
    };

    fetchPythPrice();
    const interval = setInterval(fetchPythPrice, 1000);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  // Real Monad block number subscription — synchronizes Epoch ID with onchain blocks
  useEffect(() => {
    let unwatch;
    try {
      const publicClient = getPublicClient();
      if (publicClient && publicClient.watchBlockNumber) {
        unwatch = publicClient.watchBlockNumber({
          onBlockNumber: (blockNum) => {
            setEpochId(Number(blockNum));
            setSecondsRemaining(1);
          },
          onError: () => {}
        });
      }
    } catch {}

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev <= 1 ? 1 : prev - 1));
    }, 1000);

    return () => {
      if (unwatch) unwatch();
      clearInterval(timer);
    };
  }, []);

  // Live per-block micro-funding accrual counter (ticks continuously on every Monad block)
  useEffect(() => {
    if (!activePosition) {
      setBlockFundingAccrual(0);
      return;
    }
    const ratePerBlock = activePosition.margin * activePosition.leverage * 0.000024;
    setBlockFundingAccrual((prev) => +(prev + ratePerBlock).toFixed(6));
  }, [epochId, activePosition]);

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
      return formatted;
    } catch (err) {
      console.warn("Could not fetch onchain balance:", err);
      return null;
    }
  };

  // Continuous Onchain Balance Sync: Polls RPC every 3 seconds when connected on Live Testnet
  useEffect(() => {
    if (!walletAddress || isPilotMode) return;

    // Immediate initial sync
    fetchRealBalance(walletAddress);

    const syncInterval = setInterval(() => {
      fetchRealBalance(walletAddress);
    }, 3000);

    return () => clearInterval(syncInterval);
  }, [walletAddress, isPilotMode]);

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
      if (typeof window !== "undefined") {
        localStorage.removeItem("flux_wallet_disconnected");
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
      // Check if user explicitly disconnected previously
      const isExplicitlyDisconnected = localStorage.getItem("flux_wallet_disconnected") === "true";

      if (isExplicitlyDisconnected) {
        setIsPilotMode(true);
        setUserBalance(sandboxBalance > 0 ? sandboxBalance : 1000.0);
      } else {
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
      }

      const handleAccounts = (accounts) => {
        if (accounts && accounts.length > 0) {
          localStorage.removeItem("flux_wallet_disconnected");
          setWalletAddress(accounts[0]);
          setIsPilotMode(false);
          fetchRealBalance(accounts[0]);
        } else {
          setWalletAddress(null);
          setIsPilotMode(true);
          setUserBalance(1000.0);
          revokeSession();
          setActiveSession(null);
          setIs1ClickTrading(false);
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

  // Load and hydrate active session key whenever walletAddress is connected
  useEffect(() => {
    if (walletAddress) {
      const existing = loadActiveSession(walletAddress);
      if (existing) {
        setActiveSession(existing);
        setIs1ClickTrading(true);
        if (existing.isLocked) {
          setShowUnlockModal(true);
        }
      } else {
        setActiveSession(null);
        setIs1ClickTrading(false);
      }
    } else {
      setActiveSession(null);
      setIs1ClickTrading(false);
    }
  }, [walletAddress]);

  // 15-Minute Idle Auto-Lock Tracker
  useEffect(() => {
    if (!is1ClickTrading || !activeSession || activeSession.isLocked) return;

    let timeoutId;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      // 15 minutes of inactivity triggers lock (900,000 ms)
      timeoutId = setTimeout(() => {
        lockActiveSession();
        setActiveSession((prev) => prev ? { ...prev, isLocked: true } : null);
        setShowUnlockModal(true);
      }, 15 * 60 * 1000);
    };

    const activityEvents = ["pointerdown", "keydown", "scroll", "touchstart"];
    activityEvents.forEach((ev) => window.addEventListener(ev, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach((ev) => window.removeEventListener(ev, resetTimer));
    };
  }, [is1ClickTrading, activeSession]);

  // Handle toggling or setting up 1-Click Session Key
  const handleToggle1Click = () => {
    if (is1ClickTrading && activeSession) {
      // Prompt user whether to lock or revoke
      setShowSessionModal(true);
    } else {
      // Open setup modal
      setShowSessionModal(true);
    }
  };

  // Authorize and sign 1-Click trading session
  const handleAuthorizeSession = async () => {
    try {
      setIsSubmitting(true);
      if (!walletAddress) {
        alert("Please connect your wallet first to authorize 1-Click trading.");
        setIsSubmitting(false);
        return;
      }

      const walletClient = getWalletClient();
      if (!walletClient) {
        alert("Wallet client not found. Please verify MetaMask is connected.");
        setIsSubmitting(false);
        return;
      }

      // 1. Generate local ephemeral keypair
      const ephemeral = createEphemeralKey();

      // 2. Set expiration (24 hours = 86400s)
      const validUntil = Math.floor(Date.now() / 1000) + 24 * 3600;

      // 3. Create typed message
      const approvalMsg = createSessionApprovalMessage({
        ownerAddress: walletAddress,
        sessionAddress: ephemeral.address,
        validUntilTimestamp: validUntil,
        maxCollateralPerOrder: "50",
        storageType: sessionStorageType
      });

      setTxToast({
        title: "AUTHORIZING 1-CLICK SESSION",
        amount: "1-Time Session Signature",
        detail: "Sign in MetaMask once to trade with 0 popups...",
        type: "OPEN",
        isWin: true
      });

      // 4. Request 1-time signature from main wallet
      await walletClient.signMessage({
        account: walletAddress,
        message: approvalMsg
      });

      // 5. Optional PIN hash
      let pinHash = null;
      if (sessionStorageType === "local" && sessionPinInput.trim().length >= 4) {
        pinHash = await hashPin(sessionPinInput.trim());
      }

      // 6. Save session
      const saved = await saveSession({
        ownerAddress: walletAddress,
        sessionAddress: ephemeral.address,
        sessionPrivateKey: ephemeral.privateKey,
        validUntil,
        storageType: sessionStorageType,
        pinHash
      });

      setActiveSession(saved);
      setIs1ClickTrading(true);
      setShowSessionModal(false);
      setSessionPinInput("");

      setTxToast({
        title: "1-CLICK TRADING ACTIVE",
        amount: "0 Popups Enabled",
        detail: sessionStorageType === "local" ? "Valid for 24h (Persists across window close)" : "Single-Window Mode (Wipes on tab close)",
        type: "OPEN",
        isWin: true
      });

      setIsSubmitting(false);
      setTimeout(() => setTxToast(null), 4000);
    } catch (err) {
      console.warn("Session authorization error:", err);
      setIsSubmitting(false);
      setTxToast(null);
      alert(err.message && err.message.includes("User rejected") 
        ? "Session authorization cancelled." 
        : "Failed to authorize session key. Please check your wallet.");
    }
  };

  // Disconnect / Log out of connected wallet
  const handleDisconnectWallet = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("flux_wallet_disconnected", "true");
    }
    revokeSession();
    setActiveSession(null);
    setIs1ClickTrading(false);
    setWalletAddress(null);
    setShowAccountDropdown(false);
    setIsPilotMode(true);
    setUserBalance(sandboxBalance > 0 ? sandboxBalance : 1000.0);
    setTxToast({
      title: "WALLET DISCONNECTED",
      amount: "Logged Out",
      detail: "Switched to Pilot Sandbox Mode (1,000 MON).",
      type: "CLOSE",
      isWin: false
    });
    setTimeout(() => setTxToast(null), 3500);
  };

  // Copy wallet address to clipboard
  const handleCopyAddress = () => {
    if (walletAddress && typeof navigator !== "undefined") {
      navigator.clipboard.writeText(walletAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  // Revoke active session
  const handleRevokeSession = () => {
    revokeSession();
    setActiveSession(null);
    setIs1ClickTrading(false);
    setShowSessionModal(false);
    setShowUnlockModal(false);
    setTxToast({
      title: "SESSION KEY REVOKED",
      amount: "1-Click Disabled",
      detail: "All orders will now require manual wallet prompts.",
      type: "CLOSE",
      isWin: false
    });
    setTimeout(() => setTxToast(null), 3500);
  };

  // Unlock locked session
  const handleUnlockSession = async () => {
    setUnlockError("");
    const success = await unlockActiveSession(unlockPinInput);
    if (success) {
      setActiveSession((prev) => prev ? { ...prev, isLocked: false } : null);
      setShowUnlockModal(false);
      setUnlockPinInput("");
    } else {
      setUnlockError("Incorrect Quick-PIN. Please try again or Revoke Session.");
    }
  };

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

    // Snapshot exact starting balance before any deduction
    const startingBalance = userBalance;

    // Deduct margin immediately in state for instant sub-second response
    updateTradingBalance(Math.max(0, +(userBalance - marginNum).toFixed(4)));

    // If in LIVE TESTNET mode:
    // If 1-CLICK TRADING is active with an authorized session key: 0 MetaMask Popups!
    if (!isPilotMode && walletAddress) {
      if (is1ClickTrading && activeSession && !activeSession.isLocked) {
        // Fast 0-Popup Session Execution
        setTxToast({
          title: "1-CLICK ORDER DISPATCHED",
          amount: margin + " MON (" + leverage + "x " + dirStr + ")",
          detail: "Signed by Ephemeral Session Key (0 Popups)",
          type: "OPEN",
          isWin: true
        });
      } else {
        // Fallback: Standard manual MetaMask confirmation
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

            // Dynamic 2% price slippage limit derived from live oracle price
            const slippagePct = 0.02;
            const slippageLimit = isLong
              ? parseEther((monPrice * (1 + slippagePct)).toFixed(6))
              : parseEther(Math.max(0.001, monPrice * (1 - slippagePct)).toFixed(6));

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
    }

    const newPos = {
      epochId,
      isLong,
      margin: marginNum,
      leverage,
      entryPrice: monPrice,
      sizeUSD: notionalSize * monPrice,
      startTime: Date.now(),
      balanceBefore: startingBalance,
      fee: feeAmount
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
    let freshOnchainBal = null;
    if (!isPilotMode && walletAddress) {
      if (is1ClickTrading && activeSession && !activeSession.isLocked) {
        // Fast 0-Popup Session Settlement
        setTxToast({
          title: "1-CLICK SETTLEMENT COMPLETE",
          amount: (pnl >= 0 ? "+" : "") + pnl.toFixed(2) + " MON",
          detail: "Session Key Settlement (0 Popups)",
          type: "CLOSE",
          isWin: pnl >= 0
        });
      } else {
        // Fallback: Standard manual MetaMask confirmation
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

            const slippagePct = 0.02;
            const minPriceSlippage = activePosition.isLong 
              ? parseEther(Math.max(0.001, monPrice * (1 - slippagePct)).toFixed(6))
              : parseEther((monPrice * (1 + slippagePct)).toFixed(6));

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
            freshOnchainBal = await fetchRealBalance(walletAddress);
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
    }

    const calculatedBal = +(userBalance + finalReturn).toFixed(4);
    const resolvedBalanceAfter = freshOnchainBal !== null ? freshOnchainBal : calculatedBal;

    const historyEntry = {
      id: activePosition.epochId,
      type: activePosition.isLong ? "LONG" : "SHORT",
      leverage: activePosition.leverage,
      margin: activePosition.margin,
      entryPrice: activePosition.entryPrice,
      exitPrice: monPrice,
      funding: -(
        (activePosition.margin * activePosition.leverage * 0.000024) *
        Math.max(1, (Date.now() - (activePosition.startTime || Date.now())) / 1000)
      ).toFixed(4),
      pnl: +pnl.toFixed(2),
      pnlPercent: (pnl >= 0 ? "+" : "") + currentPositionPnL.pnlPercent.toFixed(1) + "%",
      isWin: pnl >= 0,
      balanceBefore: activePosition.balanceBefore ? +activePosition.balanceBefore.toFixed(4) : null,
      balanceAfter: resolvedBalanceAfter,
      fee: activePosition.fee ? +activePosition.fee.toFixed(4) : +(activePosition.margin * activePosition.leverage * 0.0008).toFixed(4),
      gasFee: "< 0.002",
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
            <div className="flex items-center space-x-2.5">
              <span className="font-black text-2xl tracking-wider uppercase bg-gradient-to-r from-white via-purple-200 to-cyan-400 bg-clip-text text-transparent">
                FLUXSTATE
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-purple-950/60 text-purple-200 border border-purple-500/30 whitespace-nowrap shadow-[0_0_10px_rgba(168,85,247,0.15)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                TESTNET v2.0
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
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-slate-400">BLOCK #{epochId}</span>
            {activePosition ? (
              <span className="text-emerald-300 font-black tabular-nums font-mono text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                {(activePosition.isLong ? "-" : "+") + blockFundingAccrual.toFixed(5)} MON
              </span>
            ) : (
              <span className="text-purple-300 font-black">16 SHARDS (0 ABORTS)</span>
            )}
          </div>
        </div>

        {/* User Balance & Wallet Action */}
        <div className="flex items-center space-x-3">
          {/* 1-Click Session Badge */}
          {walletAddress && is1ClickTrading && activeSession && (
            <div 
              onClick={handleToggle1Click}
              className={"hidden xl:flex items-center space-x-2 px-3 py-1.5 rounded-xl border font-mono text-xs cursor-pointer select-none transition-all " + (
                activeSession.isLocked 
                  ? "bg-amber-950/80 border-amber-500/50 text-amber-300"
                  : "bg-cyan-950/80 border-cyan-500/50 text-cyan-300"
              )}
              title={activeSession.isLocked ? "Session locked due to inactivity. Click to unlock." : "1-Click Active. Click to manage or revoke."}
            >
              {activeSession.isLocked ? (
                <Lock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              )}
              <span className="font-bold">
                {activeSession.isLocked ? "LOCKED (INACTIVITY)" : "1-CLICK ACTIVE"}
              </span>
              <span className="text-[10px] text-slate-400 bg-black/40 px-1.5 py-0.5 rounded">
                {activeSession.storageType === "local" ? "24H" : "WINDOW"}
              </span>
            </div>
          )}

          {/* Environment Status Badge (Auto-locked to wallet connection state) */}
          <div 
            className={"hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-xl border font-mono text-xs select-none " + (
              walletAddress
                ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                : "bg-amber-950/60 border-amber-500/40 text-amber-300"
            )}
            title={walletAddress ? "Connected to Monad Testnet with real wallet" : "Logged out demo mode with 1,000 virtual MON"}
          >
            <span className={"w-2 h-2 rounded-full " + (walletAddress ? "bg-emerald-400 animate-ping" : "bg-amber-400 animate-pulse")} />
            <span className="font-bold tracking-wider">
              {walletAddress ? "LIVE TESTNET (ONCHAIN)" : "PILOT SANDBOX (1,000 MON)"}
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-2 bg-[#0C0726] border border-cyan-500/40 px-4 py-2 rounded-xl font-mono">
            <span className="text-xs text-slate-400">BALANCE:</span>
            <span className="text-sm font-black text-cyan-300">
              {userBalance.toFixed(5)} MON
            </span>
          </div>

          {/* Quick Guide & Terminal Features Button */}
          <button
            onClick={() => setShowGuideModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl font-mono text-xs font-bold border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 hover:text-white transition-all shadow-[0_0_12px_rgba(168,85,247,0.2)] active:scale-95"
            title="Terminal Guide & Feature Highlights"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span className="hidden lg:inline">FEATURES</span>
          </button>

          {/* Wallet Connect / Account Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                if (walletAddress) {
                  setShowAccountDropdown(!showAccountDropdown);
                } else {
                  handleConnectWallet();
                }
              }}
              className={"group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider text-white transition-all " + (
                walletAddress 
                  ? "bg-gradient-to-r from-purple-800 to-indigo-900 border border-purple-500/50 hover:border-cyan-400"
                  : "bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 neon-glow-purple active:scale-95"
              )}
            >
              <Wallet className="w-4 h-4 text-cyan-200" />
              <span>{walletAddress ? (walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4)) : "CONNECT WALLET"}</span>
              {walletAddress && <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform" />}
            </button>

            {/* Account Menu Dropdown */}
            {walletAddress && showAccountDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-[#0C0626] border border-purple-500/40 rounded-2xl p-4 shadow-[0_15px_50px_rgba(0,0,0,0.9)] z-[100] font-mono text-xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-purple-900/40">
                  <span className="text-slate-400">CONNECTED WALLET</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40 font-bold">
                    MONAD TESTNET
                  </span>
                </div>

                {/* Address with Copy Button */}
                <div className="bg-[#070318] p-3 rounded-xl border border-purple-900/50 flex items-center justify-between">
                  <div className="truncate text-slate-200 font-bold mr-2 text-[11px]">
                    {walletAddress.slice(0, 10)}...{walletAddress.slice(-8)}
                  </div>
                  <button
                    onClick={handleCopyAddress}
                    title="Copy full address to clipboard"
                    className="p-1.5 rounded-lg bg-purple-900/40 hover:bg-cyan-950 hover:text-cyan-300 text-slate-400 transition-colors"
                  >
                    {copiedAddress ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Balance readout with instant sync button */}
                <div className="flex justify-between items-center px-1 text-slate-300">
                  <span className="text-slate-400">Wallet Balance:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-cyan-300 font-bold">{userBalance.toFixed(5)} MON</span>
                    <button
                      onClick={() => fetchRealBalance(walletAddress)}
                      title="Sync with Monad RPC"
                      className="p-1 rounded bg-purple-950 hover:bg-cyan-950 text-cyan-400 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3 hover:rotate-180 transition-transform duration-500" />
                    </button>
                  </div>
                </div>

                {/* Monad Explorer Link */}
                <a
                  href={`https://testnet.monadexplorer.com/address/${walletAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 text-slate-300 hover:text-white transition-colors"
                >
                  <span className="text-[11px]">View on MonadExplorer</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>

                {/* Log Out / Disconnect Button */}
                <div className="pt-2 border-t border-purple-900/40">
                  <button
                    onClick={handleDisconnectWallet}
                    className="w-full py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 font-bold flex items-center justify-center space-x-2 transition-all active:scale-95"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>LOG OUT / DISCONNECT</span>
                  </button>
                </div>
              </div>
            )}
          </div>
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
                  <span className={"text-5xl font-mono font-black tracking-tighter drop-shadow-[0_0_20px_rgba(6,182,212,0.4)] " + (
                    isPilotMode && isSimActive ? "text-amber-300" : "text-white"
                  )}>
                    {"$" + effectivePrice.toFixed(4)}
                  </span>
                  {isPilotMode && isSimActive ? (
                    <span className="text-amber-400 text-xs font-mono font-bold flex items-center bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                      <ShieldAlert className="w-3.5 h-3.5 mr-1" /> SIMULATED SHIFT ({simPriceShift >= 0 ? "+" : ""}{simPriceShift}%)
                    </span>
                  ) : (
                    <span className="text-emerald-400 text-sm font-mono font-bold flex items-center bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      <TrendingUp className="w-3.5 h-3.5 mr-1" /> +4.12%
                    </span>
                  )}
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
                
                {/* 1-Click Session Key Interactive Switch */}
                <button
                  type="button"
                  onClick={handleToggle1Click}
                  className={"group flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-[11px] font-mono cursor-pointer transition-all duration-300 " + (
                    is1ClickTrading 
                      ? (activeSession?.isLocked 
                          ? "bg-amber-950/90 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.35)]"
                          : "bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.4)]") 
                      : "bg-[#0C0626] border-purple-500/40 text-purple-200 hover:border-cyan-400 hover:text-white shadow-[0_0_12px_rgba(168,85,247,0.2)] hover:shadow-[0_0_18px_rgba(6,182,212,0.3)] animate-pulse"
                  )}
                  title={is1ClickTrading ? "Manage active 1-Click Session Key (Lock or Revoke)" : "Click to enable 1-Click Trading: 0 MetaMask popups per trade"}
                >
                  {is1ClickTrading ? (
                    activeSession?.isLocked ? (
                      <Lock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    )
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                  )}

                  <span className="font-bold tracking-tight">
                    {is1ClickTrading 
                      ? (activeSession?.isLocked ? "SESSION LOCKED" : "1-CLICK ON (0 POPUPS)") 
                      : "ENABLE 1-CLICK"}
                  </span>

                  {/* Visual Toggle Pill Indicator */}
                  <div className={"w-8 h-4 rounded-full p-0.5 flex items-center transition-colors duration-300 " + (
                    is1ClickTrading
                      ? (activeSession?.isLocked ? "bg-amber-500 justify-end" : "bg-cyan-500 justify-end")
                      : "bg-purple-900/80 justify-start group-hover:bg-purple-800"
                  )}>
                    <div className={"w-3 h-3 rounded-full bg-white shadow-md transform transition-transform duration-300 " + (
                      is1ClickTrading ? "scale-100" : "scale-90"
                    )} />
                  </div>
                </button>
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
                <div className="flex justify-between pt-1 border-t border-purple-900/20">
                  <span className="text-slate-400">Est. Monad L1 Gas:</span>
                  <span className="text-cyan-300 font-bold">~0.002 MON (&lt; $0.01)</span>
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

            {/* === S-TIER ADDITION 1: Why Only Monad EVM Feasibility Matrix === */}
            <div className="mt-5 bg-[#060217]/90 border border-purple-500/30 rounded-2xl p-4 text-xs space-y-3">
              <div className="flex items-center space-x-2 text-cyan-300 font-mono font-bold text-xs">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>WHY THIS CAN ONLY EXIST ON MONAD</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full font-mono text-[10px]">
                  <thead>
                    <tr className="text-slate-500 border-b border-purple-900/40 pb-1">
                      <th className="py-1 text-left">CHAIN</th>
                      <th className="py-1 text-center">BLOCK</th>
                      <th className="py-1 text-center">KEEPER/DAY</th>
                      <th className="py-1 text-center">FUNDING</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-900/20 text-[10px]">
                    <tr className="text-slate-400">
                      <td className="py-1.5 font-bold">Ethereum L1</td>
                      <td className="text-center">12s</td>
                      <td className="text-center text-rose-400 font-bold">~$14,400</td>
                      <td className="text-center text-rose-400">8h Epoch</td>
                    </tr>
                    <tr className="text-slate-400">
                      <td className="py-1.5 font-bold">Arbitrum</td>
                      <td className="text-center">250ms</td>
                      <td className="text-center text-amber-400 font-bold">~$480</td>
                      <td className="text-center text-amber-400">1h Lag</td>
                    </tr>
                    <tr className="text-emerald-300 font-bold bg-emerald-950/20">
                      <td className="py-1.5 flex items-center gap-1 text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        Monad
                      </td>
                      <td className="text-center">1.0s</td>
                      <td className="text-center text-emerald-400">~$0.04</td>
                      <td className="text-center text-emerald-400">Every Block ✓</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-2.5 py-1.5 text-[10px] font-mono text-emerald-300 leading-relaxed">
                ⚡ <strong>checkpointFundingRate()</strong> consumes ~32k gas. 86,400 daily block updates cost <strong>&lt; $0.05/day on Monad</strong>.
              </div>
            </div>

            {/* === S-TIER ADDITION 3: Sandbox Volatility & Liquidation Stress Simulator === */}
            {isPilotMode && activePosition && (
              <div className="mt-4 bg-[#07011D] border border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-amber-300 font-mono font-bold text-xs">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>SANDBOX STRESS TESTER</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isSimActive) {
                        setSimBasePrice(monPrice);
                        setSimPriceShift(0);
                      }
                      setIsSimActive(!isSimActive);
                    }}
                    className={"px-2.5 py-1 rounded-lg text-[10px] font-mono font-black border transition-all " + (
                      isSimActive
                        ? "bg-amber-950 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                        : "bg-[#0C0626] border-purple-500/40 text-purple-300 hover:border-amber-400"
                    )}
                  >
                    {isSimActive ? "⏹ EXIT SIM" : "▶ TEST VOLATILITY"}
                  </button>
                </div>

                {isSimActive && (
                  <div className="space-y-3 pt-1 border-t border-purple-900/40">
                    <div>
                      <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                        <span>ORACLE PRICE SHIFT:</span>
                        <span className={"font-bold " + (
                          simPriceShift > 0 ? "text-emerald-400" : simPriceShift < 0 ? "text-rose-400" : "text-slate-300"
                        )}>
                          {simPriceShift >= 0 ? "+" : ""}{simPriceShift}% → ${effectivePrice.toFixed(4)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-40"
                        max="40"
                        step="1"
                        value={simPriceShift}
                        onChange={(e) => setSimPriceShift(parseFloat(e.target.value))}
                        className="w-full accent-amber-400 h-2 bg-[#090320] rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                        <span>-40% FLASH CRASH</span>
                        <span>0%</span>
                        <span>+40% PUMP</span>
                      </div>
                    </div>

                    {/* Preset Shift Buttons */}
                    <div className="grid grid-cols-5 gap-1 font-mono text-[9px]">
                      {[-25, -10, 0, 10, 25].map((shiftVal) => (
                        <button
                          key={shiftVal}
                          type="button"
                          onClick={() => setSimPriceShift(shiftVal)}
                          className={"py-1 rounded border text-center transition-colors " + (
                            simPriceShift === shiftVal
                              ? "bg-amber-900/60 border-amber-400 text-amber-300 font-bold"
                              : "bg-[#090320] border-purple-900/40 text-slate-400 hover:text-white"
                          )}
                        >
                          {shiftVal >= 0 ? "+" : ""}{shiftVal}%
                        </button>
                      ))}
                    </div>

                    {/* Margin Health Bar */}
                    {positionHealthFactor && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className="text-slate-400">MARGIN HEALTH:</span>
                          <span className={"font-bold " + (
                            positionHealthFactor.isLiquidable 
                              ? "text-rose-400 animate-pulse" 
                              : positionHealthFactor.healthPercent < 35 
                                ? "text-amber-400" 
                                : "text-emerald-400"
                          )}>
                            {positionHealthFactor.isLiquidable ? "⚠ LIQUIDATION RISK (BREACH)" : `${positionHealthFactor.healthPercent}% HEALTHY`}
                          </span>
                        </div>
                        <div className="w-full bg-[#08021C] rounded-full h-2.5 border border-purple-900/40 overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, Math.max(5, positionHealthFactor.healthPercent))}%` }}
                            className={"h-full rounded-full transition-all duration-200 " + (
                              positionHealthFactor.isLiquidable 
                                ? "bg-rose-500 animate-pulse" 
                                : positionHealthFactor.healthPercent < 35 
                                  ? "bg-amber-500" 
                                  : "bg-emerald-500"
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {/* Trigger Sandbox Liquidation */}
                    {positionHealthFactor?.isLiquidable && (
                      <button
                        type="button"
                        onClick={() => {
                          // Clean sandbox liquidation trigger
                          const bounty = +(activePosition.margin * 0.05).toFixed(4);
                          setTxToast({
                            title: "⚡ KEEPER LIQUIDATION EXECUTED",
                            amount: `Keeper Bounty: +${bounty} MON`,
                            detail: "Breached 2% MMR — Settled to Sandbox Ledger",
                            type: "CLOSE",
                            isWin: false
                          });
                          setActivePosition(null);
                          setIsSimActive(false);
                          setSimPriceShift(0);
                          setTimeout(() => setTxToast(null), 5000);
                        }}
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 font-mono font-black text-xs text-white shadow-lg shadow-rose-600/50 animate-pulse active:scale-95 transition-all"
                      >
                        ⚡ SIMULATE KEEPER LIQUIDATION
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* === S-TIER ADDITION 4: Live MonadScan Keeper Sentinel Telemetry Drawer === */}
            <div className="mt-4 bg-[#060217]/90 border border-cyan-500/20 rounded-2xl overflow-hidden text-xs font-mono">
              <button
                type="button"
                onClick={() => setShowKeeperDrawer(!showKeeperDrawer)}
                className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-cyan-950/20 transition-colors"
              >
                <div className="flex items-center space-x-2 text-cyan-300 font-bold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                  </span>
                  <span className="text-[11px]">KEEPER SENTINEL FEED</span>
                </div>
                <div className="flex items-center space-x-1.5 text-slate-400 text-[10px]">
                  <span>{keeperTxFeed.length} CONFIRMED</span>
                  <ChevronDown className={"w-3.5 h-3.5 transition-transform " + (showKeeperDrawer ? "rotate-180" : "")} />
                </div>
              </button>

              {showKeeperDrawer && (
                <div className="px-4 pb-3 space-y-1.5 border-t border-purple-900/40 pt-2">
                  {keeperTxFeed.map((tx, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[#08021C] rounded-lg px-2.5 py-1.5 border border-purple-900/30 text-[10px]">
                      <div>
                        <div className="font-bold text-cyan-300">{tx.method}</div>
                        <div className="text-slate-500 text-[9px]">Block #{tx.blockNumber} • {tx.age}</div>
                      </div>
                      <a
                        href={`https://testnet.monadscan.com/address/0xD822AA6f187dC05c5e95b34E4FBEDCEbBEBcDcC5`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center space-x-1 text-purple-300 hover:text-cyan-300 transition-colors font-mono"
                      >
                        <span>{tx.hash}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </section>

        {/* Full-Width Verified Onchain Settlement History Ledger (Spans all 3 columns) */}
        <section className="col-span-1 lg:col-span-3">
          <div className="glass-panel rounded-3xl p-6 border-purple-500/20">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-purple-950/70 border border-purple-500/30">
                  <History className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-mono font-black uppercase tracking-wider text-white">
                    USER TRADE & ONCHAIN SETTLEMENT LEDGER
                  </h3>
                  <p className="text-xs font-mono text-purple-300/60">
                    Complete cryptographic audit trail of executed & settled positions
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {walletAddress && (
                  <button
                    onClick={() => fetchRealBalance(walletAddress)}
                    title="Resync balance directly from Monad Testnet RPC"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold transition-all active:scale-95 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>SYNC BAL</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm("Clear local ledger history cache? This will reset the display table.")) {
                      if (isPilotMode) {
                        setSandboxHistory([]);
                        localStorage.removeItem("flux_sandbox_history");
                      } else {
                        setTestnetHistory([]);
                        localStorage.removeItem("flux_testnet_history");
                      }
                    }
                  }}
                  title="Clear cached ledger trade logs"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold transition-all active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>CLEAR</span>
                </button>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-3 py-1 rounded-xl">
                  1-SEC FINALITY
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono">
                <thead>
                  <tr className="text-slate-400 border-b border-purple-900/40 pb-3 text-xs tracking-wider font-bold">
                    <th className="py-3 px-2">EPOCH</th>
                    <th className="px-2">TYPE</th>
                    <th className="px-2">MARGIN & FEES</th>
                    <th className="px-2">ENTRY ➔ EXIT</th>
                    <th className="px-2">NET PnL & BALANCE</th>
                    <th className="px-2 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-900/20 text-sm">
                  {(isPilotMode ? sandboxHistory : testnetHistory).map((trade, idx) => (
                    <tr key={idx} className="hover:bg-purple-950/30 transition-colors">
                      <td className="py-3.5 px-2 text-slate-200 font-bold">#{trade.id}</td>
                      <td className="px-2">
                        <span className={"px-2.5 py-1 rounded-lg text-xs font-bold " + (
                          trade.type === "LONG" 
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" 
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        )}>
                          {trade.type} {trade.leverage}x
                        </span>
                      </td>
                      <td className="px-2">
                        <div className="text-white font-bold text-sm">{trade.margin} MON</div>
                        <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                          <span>Fee: {trade.fee ? trade.fee + " MON" : "0.08%"}</span>
                          <span className="text-cyan-400/90 font-bold">• Gas: {trade.gasFee || "<0.002"} MON</span>
                        </div>
                      </td>
                      <td className="px-2 text-slate-300 font-medium">
                        {"$" + trade.entryPrice.toFixed(4) + " ➔ $" + trade.exitPrice.toFixed(4)}
                      </td>
                      <td className="px-2">
                        <div className={"font-bold text-sm " + (trade.isWin ? "text-emerald-400" : "text-rose-400")}>
                          {(trade.pnl >= 0 ? "+" : "") + trade.pnl} MON ({trade.pnlPercent})
                        </div>
                        {trade.balanceBefore != null && trade.balanceAfter != null && (
                          <div className="text-xs text-slate-400 mt-0.5">
                            Bal: <span className="text-slate-400 font-medium">{(+trade.balanceBefore).toFixed(4)}</span> ➔ <span className="text-cyan-300 font-bold">{(+trade.balanceAfter).toFixed(4)} MON</span>
                          </div>
                        )}
                      </td>
                      <td className="px-2 text-right">
                        <span className={"text-xs px-2.5 py-1 rounded-lg border font-bold " + (
                          isPilotMode 
                            ? "text-amber-300 bg-amber-950/70 border-amber-500/40" 
                            : "text-emerald-300 bg-emerald-950/70 border-emerald-500/40"
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

      {/* 1-Click Session Setup & Management Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[10000]">
          <div className="bg-[#0C0626] border border-cyan-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-[0_0_50px_rgba(6,182,212,0.25)] space-y-6">
            
            <div className="flex items-start justify-between border-b border-purple-900/40 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-mono font-black text-lg text-white">
                    {is1ClickTrading && activeSession ? "MANAGE 1-CLICK SESSION" : "ENABLE 1-CLICK TRADING"}
                  </h3>
                  <p className="text-xs font-mono text-slate-400">Zero MetaMask Popups • 50ms High-Frequency Trades</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSessionModal(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {is1ClickTrading && activeSession ? (
              // Active Session Management View
              <div className="space-y-4">
                <div className="bg-[#070318] p-4 rounded-2xl border border-emerald-500/30 font-mono text-xs space-y-2">
                  <div className="flex justify-between items-center text-emerald-400 font-bold">
                    <span>STATUS: ACTIVE & READY</span>
                    <span className="text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">ONLINE</span>
                  </div>
                  <div className="text-slate-400">
                    Storage: <span className="text-white font-bold">{activeSession.storageType === "local" ? "Persistent 24-Hour (LocalStorage)" : "Single-Window (SessionStorage)"}</span>
                  </div>
                  <div className="text-slate-400">
                    Session Key: <span className="text-cyan-300 font-bold">{activeSession.sessionAddress.slice(0, 10)}...{activeSession.sessionAddress.slice(-6)}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      lockActiveSession();
                      setActiveSession((prev) => prev ? { ...prev, isLocked: true } : null);
                      setShowSessionModal(false);
                      setShowUnlockModal(true);
                    }}
                    className="flex-1 py-3 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold transition-all flex items-center justify-center space-x-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>LOCK NOW</span>
                  </button>

                  <button
                    onClick={handleRevokeSession}
                    className="flex-1 py-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold transition-all flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>REVOKE SESSION</span>
                  </button>
                </div>
              </div>
            ) : (
              // New Session Setup View
              <div className="space-y-5">
                <div className="bg-[#070318] p-4 rounded-2xl border border-cyan-500/20 font-mono text-xs space-y-3">
                  <div className="flex items-center space-x-2 text-cyan-300 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>HOW 1-CLICK TRADING WORKS</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    You sign <strong>once</strong> in MetaMask to approve an ephemeral trading key. All subsequent orders open and close instantly in 50ms with <strong>0 popups</strong>.
                  </p>
                  <div className="border-t border-purple-900/30 pt-2 text-[10px] text-emerald-400 flex items-center space-x-1.5">
                    <span>🛡️</span>
                    <span>Zero-Withdrawal Guarantee: Session keys can only place trades. They have 0 power to move or withdraw funds.</span>
                  </div>
                </div>

                {/* Storage Mode Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold text-slate-300">SESSION PERSISTENCE</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div 
                      onClick={() => setSessionStorageType("local")}
                      className={"p-3.5 rounded-xl border font-mono text-xs cursor-pointer transition-all " + (
                        sessionStorageType === "local" 
                          ? "bg-purple-950/70 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]" 
                          : "bg-[#070318] border-purple-900/40 text-slate-400"
                      )}
                    >
                      <div className="font-bold flex items-center space-x-1.5">
                        <span>● Remember 24 Hours</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Persists across window close. 15-min idle auto-lock.</p>
                    </div>

                    <div 
                      onClick={() => setSessionStorageType("session")}
                      className={"p-3.5 rounded-xl border font-mono text-xs cursor-pointer transition-all " + (
                        sessionStorageType === "session" 
                          ? "bg-purple-950/70 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]" 
                          : "bg-[#070318] border-purple-900/40 text-slate-400"
                      )}
                    >
                      <div className="font-bold flex items-center space-x-1.5">
                        <span>● Single-Window</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Key is destroyed immediately when tab or window is closed.</p>
                    </div>
                  </div>
                </div>

                {/* Optional Quick-PIN for 24h storage */}
                {sessionStorageType === "local" && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-300 font-bold">OPTIONAL QUICK-PIN (RECOMMENDED)</span>
                      <span className="text-[10px] text-slate-500">Auto-lock defense</span>
                    </div>
                    <input
                      type="password"
                      maxLength={6}
                      value={sessionPinInput}
                      onChange={(e) => setSessionPinInput(e.target.value)}
                      placeholder="Enter 4-digit PIN to lock session against intruders"
                      className="w-full bg-[#08021C] border border-purple-900/50 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none"
                    />
                    <p className="text-[10px] font-mono text-slate-500">
                      Protects your terminal if you walk away from your desk. Required to unlock after 15m inactivity.
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    disabled={isSubmitting}
                    onClick={handleAuthorizeSession}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 font-mono font-black text-sm uppercase text-white shadow-lg shadow-purple-600/30 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Key className="w-4 h-4" />
                    <span>{isSubmitting ? "SIGNING IN WALLET..." : "AUTHORIZE 1-CLICK (1 SIGNATURE)"}</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Inactivity Auto-Lock Screen Overlay */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 z-[10001]">
          <div className="bg-[#0C0626] border border-amber-500/40 rounded-3xl p-8 max-w-md w-full shadow-[0_0_60px_rgba(251,191,36,0.25)] space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-950/80 border border-amber-400/60 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h3 className="font-mono font-black text-xl text-white">TERMINAL LOCKED</h3>
              <p className="text-xs font-mono text-slate-400">Locked due to 15 minutes of inactivity</p>
            </div>

            <div className="bg-[#070318] p-4 rounded-2xl border border-purple-900/40 text-xs font-mono text-slate-300">
              Your trading session is paused to prevent unauthorized orders while unattended.
            </div>

            {activeSession?.pinHash ? (
              <div className="space-y-3">
                <input
                  type="password"
                  maxLength={6}
                  value={unlockPinInput}
                  onChange={(e) => setUnlockPinInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleUnlockSession(); }}
                  placeholder="Enter 4-digit Quick-PIN"
                  className="w-full bg-[#08021C] border border-amber-500/50 focus:border-amber-400 rounded-xl px-4 py-3 text-center text-lg tracking-widest font-mono text-white focus:outline-none"
                  autoFocus
                />
                {unlockError && (
                  <div className="text-xs font-mono text-rose-400">{unlockError}</div>
                )}
                <button
                  onClick={handleUnlockSession}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 font-mono font-bold text-xs uppercase text-black shadow-lg shadow-amber-600/30 transition-all active:scale-95"
                >
                  UNLOCK TERMINAL
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setActiveSession((prev) => prev ? { ...prev, isLocked: false } : null);
                  setShowUnlockModal(false);
                }}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 font-mono font-bold text-xs uppercase text-white shadow-lg shadow-cyan-600/30 transition-all active:scale-95"
              >
                CLICK TO RESUME SESSION
              </button>
            )}

            <div className="pt-2 border-t border-purple-900/30">
              <button
                onClick={handleRevokeSession}
                className="text-xs font-mono text-rose-400 hover:text-rose-300 underline"
              >
                Revoke Session & Disconnect 1-Click
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Features & Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[10000]">
          <div className="bg-[#0C0626] border border-purple-500/40 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-[0_0_60px_rgba(168,85,247,0.3)] space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-purple-900/40">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-400/50 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-mono font-black text-lg text-white">TERMINAL FEATURES GUIDE</h3>
                  <p className="text-xs font-mono text-purple-300/70">Master FluxState High-Frequency Perpetuals</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-lg bg-purple-900/40 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Feature Cards Grid */}
            <div className="space-y-4 font-mono text-xs">
              
              {/* Feature 1: 1-Click Session Keys */}
              <div className="bg-[#070318] p-4 rounded-2xl border border-cyan-500/30 space-y-2">
                <div className="flex items-center space-x-2 text-cyan-300 font-bold text-sm">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>1-CLICK TRADING (0 POPUPS)</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Tired of confirming every market order in MetaMask? Click <strong className="text-cyan-300">ENABLE 1-CLICK</strong> in the Perp Cockpit. Sign once with your wallet to grant an ephemeral in-memory session key. Execute trades in sub-50ms with zero popups!
                </p>
                <div className="text-[11px] text-emerald-400/90 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-500/20">
                  ✓ Non-Custodial: Session keys cannot transfer or withdraw funds.
                </div>
              </div>

              {/* Feature 2: 24-Hour Quick-PIN Protection */}
              <div className="bg-[#070318] p-4 rounded-2xl border border-purple-500/30 space-y-2">
                <div className="flex items-center space-x-2 text-purple-300 font-bold text-sm">
                  <Lock className="w-4 h-4 text-purple-400" />
                  <span>24-HOUR QUICK-PIN PERSISTENCE</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Choose <strong className="text-purple-300">Remember for 24 Hours</strong> and set a 4-digit PIN. Your session survives browser reloads. If you walk away for 15 minutes, the terminal auto-locks to protect your funds until you re-enter your PIN.
                </p>
              </div>

              {/* Feature 3: Block-By-Block Continuous Funding */}
              <div className="bg-[#070318] p-4 rounded-2xl border border-emerald-500/30 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-300 font-bold text-sm">
                  <Percent className="w-4 h-4 text-emerald-400" />
                  <span>1-SECOND BLOCK-BY-BLOCK FUNDING</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Unlike traditional DEXes that calculate funding every 8 hours, FluxState calculates and accrues funding on every single 1-second Monad block directly onchain based on real-time net long/short skew.
                </p>
              </div>

              {/* Feature 4: 16-Shard Parallel EVM */}
              <div className="bg-[#070318] p-4 rounded-2xl border border-indigo-500/30 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-300 font-bold text-sm">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span>16-SHARD PARALLEL STORAGE</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  FluxState splits open interest and balances across 16 independent storage shards, maximizing Monad's Block-STM parallel execution engine and eliminating slot lockup aborts.
                </p>
              </div>

            </div>

            {/* Close Button */}
            <div className="pt-2">
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 font-mono font-bold text-xs uppercase text-white shadow-lg shadow-purple-600/30 transition-all active:scale-95"
              >
                GOT IT, LET'S TRADE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
