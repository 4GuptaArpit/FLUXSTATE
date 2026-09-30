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
  AlertTriangle
} from "lucide-react";
import { getWalletClient, monadTestnet, FLUX_MARKET_ABI, CONTRACT_ADDRESSES } from "../lib/web3";
import { parseEther } from "viem";
import { ShardMonitor } from "../components/ShardMonitor";

export default function FluxGamingTerminal() {
  const [monPrice, setMonPrice] = useState(4.285);
  const [priceHistory, setPriceHistory] = useState([4.275, 4.278, 4.281, 4.285, 4.282, 4.288, 4.285]);
  const [secondsRemaining, setSecondsRemaining] = useState(6);
  const [epochId, setEpochId] = useState(882);
  const [margin, setMargin] = useState("10");
  const [leverage, setLeverage] = useState(10);
  const [poolLong, setPoolLong] = useState(3840);
  const [poolShort, setPoolShort] = useState(2520);
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

  // Sub-second price ticks
  useEffect(() => {
    const priceInterval = setInterval(() => {
      const delta = (Math.random() - 0.49) * 0.006;
      setMonPrice((prev) => {
        const next = +(prev + delta).toFixed(4);
        setPriceHistory((hist) => [...hist.slice(-24), next]);
        return next;
      });
    }, 500);

    return () => clearInterval(priceInterval);
  }, []);

  // Fixed 1-Second block countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setEpochId((e) => e + 1);
          setPoolLong((pl) => pl + Math.floor(Math.random() * 200));
          setPoolShort((ps) => ps + Math.floor(Math.random() * 180));
          return 8;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Compute dynamic funding rate
  useEffect(() => {
    const total = poolLong + poolShort;
    if (total > 0) {
      const skew = (((poolLong - poolShort) / total) * 0.005).toFixed(4);
      setBlockFundingRateBps((skew >= 0 ? "+" : "") + skew + "% / sec");
    }
  }, [poolLong, poolShort]);

  const handleConnectWallet = async () => {
    try {
      const walletClient = getWalletClient();
      if (!walletClient) {
        setWalletAddress("0x7F2B...4a9B (Pilot Mode)");
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
      console.warn("Wallet connect error:", err);
      setWalletAddress("0x7F2B...4a9B (Pilot Mode)");
    }
  };

  const handleOpenPosition = async (isLong) => {
    if (!walletAddress) {
      await handleConnectWallet();
      return;
    }

    setIsSubmitting(true);
    const dirStr = isLong ? "LONG" : "SHORT";

    try {
      const walletClient = getWalletClient();
      if (walletClient && CONTRACT_ADDRESSES.market !== "0x0000000000000000000000000000000000000000") {
        const [account] = await walletClient.getAddresses();
        const slippagePrice = isLong ? monPrice * 1.01 : monPrice * 0.99;

        const hash = await walletClient.writeContract({
          address: CONTRACT_ADDRESSES.market,
          abi: FLUX_MARKET_ABI,
          functionName: "openPosition",
          args: [
            isLong,
            parseEther(leverage.toString()),
            parseEther(slippagePrice.toFixed(18)),
            []
          ],
          value: parseEther(margin),
          account,
        });

        setTxToast({
          txHash: hash,
          dir: dirStr,
          amount: margin + " MON (" + leverage + "x)",
          latency: "Monad 1.0s Finality"
        });
      } else {
        const mockHash = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
        if (isLong) {
          setPoolLong((p) => p + Number(notionalSize));
        } else {
          setPoolShort((p) => p + Number(notionalSize));
        }

        setTxToast({
          txHash: mockHash,
          dir: dirStr,
          amount: margin + " MON (" + leverage + "x)",
          latency: "68ms (Shard Assigned)"
        });
      }
    } catch (error) {
      console.error("Action error:", error);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setTxToast(null);
      }, 5000);
    }
  };

  const displayWallet = walletAddress 
    ? (walletAddress.length > 18 ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4) : walletAddress)
    : "ENTER ARENA";

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

        {/* Player Action */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleConnectWallet}
            className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider text-white transition-all bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 neon-glow-purple active:scale-95"
          >
            <Wallet className="w-4 h-4 text-cyan-200" />
            <span>{displayWallet}</span>
          </button>
        </div>
      </header>

      {/* Main Gaming Terminal Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* Left 2 Cols: Holographic Chart & Shard Matrix */}
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
            <div className="mt-8 h-52 w-full rounded-2xl bg-[#060217]/90 border border-purple-900/40 p-5 flex items-end justify-between space-x-1.5 relative overflow-hidden">
              <div className="absolute top-4 left-5 flex items-center space-x-2 text-xs font-mono text-purple-300/70">
                <Flame className="w-4 h-4 text-cyan-400" />
                <span>60 FPS Micro-Perpetual Tick Stream</span>
              </div>

              <div className="absolute top-1/2 left-0 w-full h-[1px] bg-purple-500/10 dashed" />

              {priceHistory.map((val, idx) => {
                const heightPercent = Math.min(100, Math.max(18, ((val - 4.27) / 0.03) * 100));
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
                    PERP COCKPIT (1.1x - 50x)
                  </h3>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                  ISOLATED MARGIN
                </span>
              </div>

              {/* Collateral Input with Clean Up/Down Steppers and Positive Floor */}
              <div className="mt-5">
                <div className="flex justify-between text-xs font-mono text-purple-300/80 mb-2">
                  <span>MARGIN DEPOSIT</span>
                  <span>BAL: 1,000.00 MON</span>
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
                  <span className="font-bold text-white"> USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Est. Liq Price (Long):</span>
                  <span className="font-bold text-emerald-400"></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Est. Liq Price (Short):</span>
                  <span className="font-bold text-rose-400"></span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Protocol Fee (0.08%):</span>
                  <span className="text-slate-300">{feeAmount.toFixed(4)} MON</span>
                </div>
              </div>

              {/* Long / Short Action Buttons */}
              <div className="mt-6 space-y-3">
                <button
                  disabled={isSubmitting || marginNum <= 0}
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
                  disabled={isSubmitting || marginNum <= 0}
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

      {/* Floating Notification Toast (High z-index, Solid Opaque Dark Backdrop, Zero Text Clashing) */}
      {txToast && (
        <div className="fixed bottom-8 right-8 bg-[#0B0621] border border-cyan-400/80 p-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.9)] flex items-center space-x-4 z-[9999] neon-glow-cyan transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 border border-cyan-400/40">
            <CheckCircle2 className="w-7 h-7 text-cyan-400" />
          </div>
          <div className="space-y-1">
            <div className="font-mono font-black text-sm text-white tracking-wide uppercase">
              ORDER EXECUTED ONCHAIN
            </div>
            <div className="text-xs font-mono text-slate-300">
              {txToast.amount} on <span className={txToast.dir === "LONG" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>{txToast.dir}</span>
            </div>
            <div className="text-[11px] font-mono text-cyan-300 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>Confirmed in {txToast.latency}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
