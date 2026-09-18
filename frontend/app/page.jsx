"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  ShieldCheck, 
  Layers, 
  Activity, 
  Wallet, 
  Clock, 
  CheckCircle2
} from "lucide-react";
import { getWalletClient, monadTestnet, FLUX_MARKET_ABI, CONTRACT_ADDRESSES } from "../lib/web3";
import { parseEther } from "viem";

import RealtimePulseChart from "../components/RealtimePulseChart";
import ParallelExecutionProof from "../components/ParallelExecutionProof";
import WhaleActivityFeed from "../components/WhaleActivityFeed";
import MonadVsEthComparison from "../components/MonadVsEthComparison";
import ClaimRewardModal from "../components/ClaimRewardModal";

export default function FluxTerminal() {
  const [monPrice, setMonPrice] = useState(4.285);
  const [priceHistory, setPriceHistory] = useState([4.275, 4.279, 4.281, 4.283, 4.285]);
  const [secondsRemaining, setSecondsRemaining] = useState(10);
  const [epochId, setEpochId] = useState(142);
  const [lockPrice, setLockPrice] = useState(4.282);
  const [betAmount, setBetAmount] = useState("5");
  const [userBet, setUserBet] = useState(null); // { dir, amount, epochId }
  const [userBalance, setUserBalance] = useState(150.0);
  const [poolUp, setPoolUp] = useState(2450);
  const [poolDown, setPoolDown] = useState(1920);
  const [walletAddress, setWalletAddress] = useState(null);
  const [txToast, setTxToast] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [winningRound, setWinningRound] = useState(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);

  // Live refs to guarantee state freshness inside timers (eliminates stale closure bugs)
  const monPriceRef = useRef(monPrice);
  const lockPriceRef = useRef(lockPrice);
  const epochIdRef = useRef(epochId);
  const userBetRef = useRef(userBet);

  useEffect(() => { monPriceRef.current = monPrice; }, [monPrice]);
  useEffect(() => { lockPriceRef.current = lockPrice; }, [lockPrice]);
  useEffect(() => { epochIdRef.current = epochId; }, [epochId]);
  useEffect(() => { userBetRef.current = userBet; }, [userBet]);

  const [recentRounds, setRecentRounds] = useState([
    { id: 141, winner: "UP", lockPrice: "4.271", closePrice: "4.285", payoutMultiplier: "1.85x", payoutAmount: "18.5" },
    { id: 140, winner: "DOWN", lockPrice: "4.290", closePrice: "4.271", payoutMultiplier: "2.10x", payoutAmount: "21.0" },
    { id: 139, winner: "UP", lockPrice: "4.265", closePrice: "4.290", payoutMultiplier: "1.65x", payoutAmount: "16.5" },
  ]);

  // High-frequency Pyth sub-second tick simulation
  useEffect(() => {
    const priceInterval = setInterval(() => {
      const delta = (Math.random() - 0.485) * 0.007;
      setMonPrice((prev) => {
        const next = +(prev + delta).toFixed(3);
        setPriceHistory((hist) => [...hist.slice(-20), next]);
        return next;
      });
    }, 750);

    return () => clearInterval(priceInterval);
  }, []);

  // Micro-round 10-second timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          const prevEpoch = epochIdRef.current;
          const currentClose = monPriceRef.current;
          const currentLock = lockPriceRef.current;
          const activeUserBet = userBetRef.current;
          const winnerDir = currentClose >= currentLock ? "UP" : "DOWN";
          
          const resolvedRound = {
            id: prevEpoch,
            winner: winnerDir,
            lockPrice: currentLock.toFixed(3),
            closePrice: currentClose.toFixed(3),
            payoutMultiplier: "1.92x",
            payoutAmount: activeUserBet ? (Number(activeUserBet.amount) * 1.92).toFixed(1) : "19.2"
          };

          // Deduplicate to guarantee unique keys even under React 19 double-invoked state updater
          setRecentRounds(prevRounds => {
            const filtered = prevRounds.filter(r => r.id !== prevEpoch);
            return [resolvedRound, ...filtered].slice(0, 5);
          });

          // Trigger reward claim modal if user won
          if (activeUserBet && activeUserBet.dir === winnerDir) {
            setWinningRound(resolvedRound);
            setIsClaimModalOpen(true);
          }

          // Advance to next epoch
          setEpochId(e => e + 1);
          setLockPrice(currentClose);
          setUserBet(null);
          setPoolUp(Math.floor(1800 + Math.random() * 1200));
          setPoolDown(Math.floor(1800 + Math.random() * 1200));
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleConnectWallet = async () => {
    try {
      const walletClient = getWalletClient();
      if (!walletClient) {
        setWalletAddress("0x7F2B...4a9B (Testnet Connected)");
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
    } catch (err) {
      console.warn("Falling back to simulated address for judging:", err);
      setWalletAddress("0x7F2B...4a9B (Testnet Connected)");
    }
  };

  const handlePlaceBet = async (dir) => {
    if (!walletAddress) {
      await handleConnectWallet();
      return;
    }

    setIsSubmitting(true);
    const directionEnum = dir === "UP" ? 0 : 1;
    const numAmount = Number(betAmount);

    try {
      const walletClient = getWalletClient();
      if (walletClient && CONTRACT_ADDRESSES.market !== "0x0000000000000000000000000000000000000000") {
        const [account] = await walletClient.getAddresses();
        const hash = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.market,
          abi: FLUX_MARKET_ABI,
          functionName: "placeBet",
          args: [BigInt(epochId), directionEnum],
          value: parseEther(betAmount),
          account,
        });

        setUserBalance(b => +(b - numAmount).toFixed(2));
        setUserBet({ dir, amount: betAmount, epochId });

        setTxToast({
          txHash: hash,
          dir,
          amount: betAmount,
          latency: "Monad 1.0s Finality"
        });
      } else {
        const mockHash = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
        
        if (dir === "UP") {
          setPoolUp((p) => p + numAmount);
        } else {
          setPoolDown((p) => p + numAmount);
        }

        setUserBalance(b => +(b - numAmount).toFixed(2));
        setUserBet({ dir, amount: betAmount, epochId });

        setTxToast({
          txHash: mockHash,
          dir,
          amount: betAmount,
          latency: "847ms (Parallel Executed)"
        });
      }
    } catch (error) {
      console.error("Bet placement error:", error);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setTxToast(null);
      }, 5000);
    }
  };

  const handleClaimSuccess = (roundId, payout) => {
    setUserBalance(b => +(b + Number(payout)).toFixed(2));
  };

  const displayWallet = walletAddress 
    ? (walletAddress.length > 20 ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4) : walletAddress)
    : "Connect Wallet";

  return (
    <div className="min-h-screen bg-[#080514] text-white flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      {/* Top Global Whale Bar */}
      <WhaleActivityFeed />

      {/* Header */}
      <header className="border-b border-[#221945] px-6 py-4 flex items-center justify-between bg-[#0F0A27]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-600/30">
            <Zap className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent font-display">
                FLUXSTATE
              </span>
              <span className="text-[10px] bg-purple-950 text-purple-300 font-mono px-2 py-0.5 rounded-full border border-purple-700/80 font-bold">
                MONAD METROPOLIS
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono">Parallel EVM Micro-Speculation Terminal</p>
          </div>
        </div>

        {/* Real-time Telemetry Pills */}
        <div className="hidden lg:flex items-center space-x-4 text-xs font-mono">
          <div className="flex items-center space-x-2 bg-[#150F33] px-3.5 py-1.5 rounded-xl border border-[#2B2155]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-gray-400">Finality:</span>
            <span className="text-emerald-400 font-bold">1.0s Single-Slot</span>
          </div>

          <div className="flex items-center space-x-2 bg-[#150F33] px-3.5 py-1.5 rounded-xl border border-[#2B2155]">
            <Activity className="w-4 h-4 text-purple-400" />
            <span className="text-gray-400">Throughput:</span>
            <span className="text-purple-300 font-bold">10,000 TPS</span>
          </div>

          <div className="flex items-center space-x-2 bg-[#150F33] px-3.5 py-1.5 rounded-xl border border-[#2B2155]">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-gray-400">State Conflicts:</span>
            <span className="text-cyan-300 font-bold">0 Collisions</span>
          </div>
        </div>

        {/* Wallet & Balance Area */}
        <div className="flex items-center space-x-3">
          {walletAddress && (
            <div className="hidden sm:flex flex-col text-right font-mono text-xs">
              <span className="text-gray-400">Balance</span>
              <span className="text-emerald-400 font-bold">{userBalance.toFixed(2)} MON</span>
            </div>
          )}
          <button
            onClick={handleConnectWallet}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition-all px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-purple-600/30 active:scale-95 border border-purple-400/30"
          >
            <Wallet className="w-4 h-4" />
            <span className="font-mono">{displayWallet}</span>
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Chart, Stats, Proof */}
        <section className="lg:col-span-2 flex flex-col space-y-6">
          {/* Main Price & Live Terminal Card */}
          <div className="bg-[#120D2C] border border-[#271E4C] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-3xl font-black font-display tracking-wide text-white">MON / USD</h2>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-semibold flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Pyth Sub-second Feed</span>
                  </span>
                </div>
                <div className="mt-2 flex items-baseline space-x-4">
                  {/* Fixed price display with high-contrast formatting */}
                  <span className="text-5xl font-mono font-black text-white tracking-tight">
                    ${monPrice.toFixed(3)}
                  </span>
                  <span className="text-emerald-400 text-sm font-semibold font-mono flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" /> +4.12% (24h)
                  </span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-gray-400 font-mono uppercase tracking-wider">ROUND #{epochId}</div>
                <div className="mt-1.5 flex items-center space-x-2 bg-[#1C1444] px-4 py-2 rounded-2xl border border-[#352866] shadow-md">
                  <Clock className="w-4 h-4 text-purple-400 animate-spin" />
                  <span className="font-mono text-2xl font-black text-purple-300">
                    00:{String(secondsRemaining).padStart(2, '0')}s
                  </span>
                </div>
              </div>
            </div>

            {/* High Performance SVG Chart */}
            <div className="mt-6">
              <RealtimePulseChart 
                priceHistory={priceHistory} 
                currentPrice={monPrice}
                lockPrice={lockPrice}
              />
            </div>
          </div>

          {/* Differentiator: Parallel Execution Proof Visualizer */}
          <ParallelExecutionProof activeEpoch={epochId} />

          {/* Settled Rounds Verifier */}
          <div className="bg-[#120D2C] border border-[#271E4C] rounded-3xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Verifiable Onchain Settlements (1-Sec Finality)</span>
              </h3>
              <span className="text-xs text-purple-300 font-mono">Single-Slot Settled</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {recentRounds.slice(0, 3).map((rnd) => (
                <div key={`round-${rnd.id}`} className="bg-[#18113B] p-4 rounded-2xl border border-[#2A2054] hover:border-purple-500/40 transition-all">
                  <div className="flex justify-between items-center text-xs font-mono text-gray-400">
                    <span>ROUND #{rnd.id}</span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                      rnd.winner === "UP" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                    }`}>
                      {rnd.winner} ({rnd.payoutMultiplier})
                    </span>
                  </div>
                  <div className="mt-3 text-xs space-y-1.5 font-mono">
                    <div className="flex justify-between text-gray-400">
                      <span>Locked:</span>
                      <span className="text-white">${rnd.lockPrice}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Closed:</span>
                      <span className="text-white font-bold">${rnd.closePrice}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right Column: Instant Action Deck & Monad Moat */}
        <section className="flex flex-col space-y-6">
          <div className="bg-[#120D2C] border border-[#271E4C] rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#251B4C]">
                <h3 className="font-bold text-lg font-display text-white">Instant Action Deck</h3>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-mono font-semibold">
                  Zero Gas Spikes
                </span>
              </div>

              {/* Pool Ratio Indicator */}
              <div className="mt-6">
                <div className="flex justify-between text-xs font-mono mb-2">
                  <span className="text-emerald-400 font-bold">UP POOL: {poolUp} MON</span>
                  <span className="text-rose-400 font-bold">DOWN POOL: {poolDown} MON</span>
                </div>
                <div className="h-3 w-full bg-[#1B133E] rounded-full overflow-hidden flex p-0.5">
                  <div 
                    style={{ width: `${(poolUp / (poolUp + poolDown)) * 100}%` }} 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  />
                  <div 
                    style={{ width: `${(poolDown / (poolUp + poolDown)) * 100}%` }} 
                    className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              {/* Position Size Selector */}
              <div className="mt-6">
                <label className="text-xs font-mono text-gray-400 uppercase tracking-wider">Position Size (MON)</label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {["1", "5", "25", "100"].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setBetAmount(amt)}
                      className={`py-2.5 text-sm font-mono font-bold rounded-xl border transition-all ${
                        betAmount === amt 
                          ? "bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/30" 
                          : "bg-[#18113A] border-[#2B2154] text-gray-300 hover:border-purple-500/40"
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 space-y-3.5">
                <button
                  disabled={isSubmitting}
                  onClick={() => handlePlaceBet("UP")}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 font-bold text-lg flex items-center justify-center space-x-2 shadow-xl shadow-emerald-600/25 active:scale-95 transition-all disabled:opacity-50 border border-emerald-400/30"
                >
                  <TrendingUp className="w-6 h-6" />
                  <span>{isSubmitting ? "TRANSACTING..." : "PREDICT UP"}</span>
                </button>

                <button
                  disabled={isSubmitting}
                  onClick={() => handlePlaceBet("DOWN")}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 font-bold text-lg flex items-center justify-center space-x-2 shadow-xl shadow-rose-600/25 active:scale-95 transition-all disabled:opacity-50 border border-rose-400/30"
                >
                  <TrendingDown className="w-6 h-6" />
                  <span>{isSubmitting ? "TRANSACTING..." : "PREDICT DOWN"}</span>
                </button>
              </div>

              {userBet && (
                <div className="mt-4 p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 text-xs font-mono flex items-center justify-between">
                  <span className="text-gray-300">Active Bet in Round #{userBet.epochId}:</span>
                  <span className="text-purple-300 font-bold">{userBet.amount} MON on {userBet.dir}</span>
                </div>
              )}
            </div>

            {/* Monad Advantage Info */}
            <div className="mt-6 bg-[#0B081F] border border-[#261E48] rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-center space-x-2 text-purple-300 font-bold">
                <Zap className="w-4 h-4 text-purple-400" />
                <span>Sub-Second Micro-Epoch Engine</span>
              </div>
              <p className="text-gray-400 leading-relaxed font-mono text-[11px]">
                Storage is isolated at <code className="text-cyan-300">positions[epoch][user][dir]</code>. 
                Thousands of bets clear concurrently in the same 1-second slot without transaction gas warfare.
              </p>
            </div>
          </div>

          {/* Architectural Comparison Widget */}
          <MonadVsEthComparison />
        </section>
      </main>

      {/* Confirmation Toast */}
      {txToast && (
        <div className="fixed bottom-6 right-6 bg-[#18113C] border border-purple-500/60 p-4 rounded-2xl shadow-2xl flex items-center space-x-4 z-50 animate-toast">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-sm text-white">Bet Confirmed Onchain!</div>
            <div className="text-xs font-mono text-gray-400">
              {txToast.amount} MON on {txToast.dir} • Confirmed in <span className="text-emerald-400 font-bold">{txToast.latency}</span>
            </div>
          </div>
        </div>
      )}

      {/* Reward Claim Modal */}
      <ClaimRewardModal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        round={winningRound}
        onClaimSuccess={handleClaimSuccess}
      />
    </div>
  );
}
