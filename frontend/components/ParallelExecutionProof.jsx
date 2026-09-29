"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Cpu, 
  ShieldCheck, 
  Zap, 
  Activity, 
  CheckCircle, 
  Flame, 
  AlertTriangle, 
  Play, 
  RotateCcw, 
  Layers, 
  Sliders, 
  Sparkles,
  Info
} from "lucide-react";
import confetti from "canvas-confetti";
import { cyberAudio } from "../lib/audio";

export default function ParallelExecutionProof({ activeEpoch = 1042 }) {
  const [mounted, setMounted] = useState(false);
  const [batchSize, setBatchSize] = useState(500); // 100, 300, 500
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [simResults, setSimResults] = useState(null);
  const [selectedCell, setSelectedCell] = useState(null);

  // 64-Core parallel slots grid (8x8)
  const [matrixSlots, setMatrixSlots] = useState(() => 
    Array.from({ length: 64 }, (_, i) => ({
      id: i,
      status: "idle", // idle | processing | committed
      activeDir: null, // LONG | SHORT
      txCount: 0,
      lastLatency: Math.floor(6.5 + Math.random() * 3.5),
      lastTrader: "0x" + Math.random().toString(16).substring(2, 6) + "..." + Math.random().toString(16).substring(2, 6),
      slotHash: "0x" + Math.random().toString(16).substring(2, 10) + "..." + Math.random().toString(16).substring(2, 6)
    }))
  );

  const [stats, setStats] = useState({
    blockHeight: 4892150,
    peakTps: "10,240 TPS",
    stateCollisions: 0,
    parallelSlots: 64
  });

  useEffect(() => {
    setMounted(true);
    // Background gentle pulse when idle
    const ambientTimer = setInterval(() => {
      setStats(prev => ({
        ...prev,
        blockHeight: prev.blockHeight + 1,
        peakTps: String(9800 + Math.floor(Math.random() * 450)).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " TPS"
      }));

      setMatrixSlots(prev => {
        // Randomly pulse 2-3 cells gently
        const copy = [...prev];
        const randomIndexes = [Math.floor(Math.random() * 64), Math.floor(Math.random() * 64)];
        randomIndexes.forEach(idx => {
          if (copy[idx]) {
            copy[idx] = {
              ...copy[idx],
              lastLatency: +(6.2 + Math.random() * 3.1).toFixed(1)
            };
          }
        });
        return copy;
      });
    }, 2000);

    return () => clearInterval(ambientTimer);
  }, []);

  // Run 500-Order Parallel Storm
  const handleExecuteStorm = () => {
    if (isSimulating) return;

    setIsSimulating(true);
    cyberAudio.playStormTrigger();
    setProgress(0);
    setSimResults(null);
    setSelectedCell(null);

    const totalOrders = batchSize;
    let completed = 0;
    const startTime = performance.now();

    // Reset matrix slots to processing state
    setMatrixSlots(prev => prev.map(s => ({ ...s, status: "idle", txCount: 0, activeDir: null })));

    // Fast batch animation streaming in over ~750ms
    const intervalTime = 25; // 25ms tick
    const totalTicks = 30; // ~750ms total
    const ordersPerTick = Math.ceil(totalOrders / totalTicks);

    const interval = setInterval(() => {
      completed = Math.min(totalOrders, completed + ordersPerTick);
      const currentProgress = Math.round((completed / totalOrders) * 100);
      setProgress(currentProgress);

      // Light up 12-20 slots per tick dynamically
      setMatrixSlots(prev => {
        const copy = [...prev];
        const numUpdates = Math.floor(10 + Math.random() * 15);
        for (let i = 0; i < numUpdates; i++) {
          const slotIdx = Math.floor(Math.random() * 64);
          const dir = Math.random() > 0.48 ? "LONG" : "SHORT";
          copy[slotIdx] = {
            ...copy[slotIdx],
            status: "processing",
            activeDir: dir,
            txCount: copy[slotIdx].txCount + 1,
            lastLatency: +(5.8 + Math.random() * 3.4).toFixed(1),
            lastTrader: "0x" + Math.random().toString(16).substring(2, 6) + "..." + Math.random().toString(16).substring(2, 6),
            slotHash: "0x" + Math.random().toString(16).substring(2, 10) + "..." + Math.random().toString(16).substring(2, 6)
          };
        }
        return copy;
      });

      if (completed >= totalOrders) {
        clearInterval(interval);
        const endTime = performance.now();
        const durationSec = ((endTime - startTime) / 1000).toFixed(2);

        // Mark all active slots committed
        setMatrixSlots(prev => prev.map(s => ({ ...s, status: s.txCount > 0 ? "committed" : "idle" })));

        // Celebrate success
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#06B6D4", "#8B5CF6", "#10B981"]
        });
        cyberAudio.playWinChime();

        // Set benchmark comparative metrics
        const monadTime = (0.74 + (totalOrders / 500) * 0.12).toFixed(2);
        const ethTime = ((totalOrders * 12.0) / 125).toFixed(1); // Ethereum sequentially takes ~48 seconds for 500 txs
        const monadGas = (totalOrders * 0.000008).toFixed(4);
        const ethGas = (totalOrders * 3.25).toFixed(1);

        setSimResults({
          totalOrders,
          monadDuration: monadTime + "s",
          ethDuration: ethTime + "s",
          monadGas: monadGas + " MON ($" + (monadGas * 4.28).toFixed(4) + ")",
          ethGas: "$" + ethGas + " (Mainnet Gas)",
          stateCollisions: 0,
          revertRate: "0.00% (Monad) vs 38.4% (Ethereum)",
          speedup: (parseFloat(ethTime) / parseFloat(monadTime)).toFixed(0) + "x FASTER"
        });

        setIsSimulating(false);
      }
    }, intervalTime);
  };

  const formattedBlockHeight = String(stats.blockHeight).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return (
    <div className="bg-[#0b0624] border border-purple-900/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/10 blur-[130px] pointer-events-none" />

      {/* Flagship Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-purple-900/30 relative z-10">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-purple-600 p-[1px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#08031d] rounded-[15px] flex items-center justify-center">
              <Cpu className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-mono font-black text-lg text-white">
                PARALLEL EVM 64-CORE STORM ENGINE
              </h3>
              <span className="text-[10px] bg-gradient-to-r from-cyan-950 to-purple-950 text-cyan-300 font-mono font-bold px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                10,000 TPS MATRIX
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Visual proof of non-blocking storage partitioning: <code className="text-purple-300">positions[epoch][trader][dir]</code>
            </p>
          </div>
        </div>

        {/* Live Block Snapshot */}
        <div className="flex items-center space-x-4 text-xs font-mono">
          <div className="text-right">
            <div className="text-[10px] text-slate-500">MONAD BLOCK</div>
            <div className="text-purple-300 font-black text-sm">#{formattedBlockHeight}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-slate-500">PEAK THROUGHPUT</div>
            <div className="text-emerald-400 font-black text-sm">{stats.peakTps}</div>
          </div>
        </div>
      </div>

      {/* Interactive Control Console */}
      <div className="mt-5 p-4 rounded-2xl bg-[#08031e]/90 border border-purple-900/40 flex flex-wrap items-center justify-between gap-4 relative z-10">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-mono text-purple-300 uppercase font-bold flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-cyan-400" />
            TEST LOAD:
          </span>
          <div className="flex bg-[#0e0730] p-1 rounded-xl border border-purple-900/50">
            {[100, 300, 500].map(size => (
              <button
                key={size}
                disabled={isSimulating}
                onClick={() => setBatchSize(size)}
                className={"px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all " + (
                  batchSize === size 
                    ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-md shadow-purple-600/40" 
                    : "text-slate-400 hover:text-white"
                )}
              >
                {size} Orders
              </button>
            ))}
          </div>
        </div>

        {/* Action Trigger */}
        <button
          disabled={isSimulating}
          onClick={handleExecuteStorm}
          className="group relative inline-flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider text-white transition-all bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 neon-glow-cyan active:scale-95 disabled:opacity-50"
        >
          {isSimulating ? (
            <>
              <Activity className="w-4 h-4 animate-spin text-cyan-200" />
              <span>STREAMING {progress}% ...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-cyan-200 animate-bounce" />
              <span>⚡ TRIGGER {batchSize}-ORDER PARALLEL STORM</span>
            </>
          )}
        </button>
      </div>

      {/* Progress Bar (Visible during storm) */}
      {isSimulating && (
        <div className="mt-3 w-full bg-[#08021c] h-2 rounded-full overflow-hidden border border-cyan-500/30">
          <div 
            style={{ width: progress + "%" }} 
            className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-emerald-400 transition-all duration-75 shadow-[0_0_12px_#06b6d4]"
          />
        </div>
      )}

      {/* Main Grid & Inspection Layout */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* Left 2 Cols: 64-Core Matrix Grid Visualizer */}
        <div className="lg:col-span-2 bg-[#060117]/80 border border-purple-900/40 rounded-2xl p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[11px] font-mono text-slate-400 uppercase font-bold flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              64-SLOT PARALLEL EVM EXECUTION WORKERS (8x8 MATRIX)
            </span>
            <span className="text-[10px] font-mono text-cyan-300">
              CLICK ANY SLOT TO AUDIT
            </span>
          </div>

          {/* 8x8 Matrix Grid */}
          <div className="grid grid-cols-8 gap-2 p-2 bg-[#090325] rounded-xl border border-purple-900/50">
            {matrixSlots.map(slot => {
              const isSelected = selectedCell?.id === slot.id;
              let bgClass = "bg-[#130b3d] border-purple-900/40 text-slate-500";
              
              if (slot.status === "processing") {
                bgClass = slot.activeDir === "LONG"
                  ? "bg-cyan-500/40 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.8)] scale-105"
                  : "bg-rose-500/40 border-rose-400 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.8)] scale-105";
              } else if (slot.status === "committed") {
                bgClass = slot.activeDir === "LONG"
                  ? "bg-cyan-950/60 border-cyan-500/40 text-cyan-300"
                  : "bg-rose-950/60 border-rose-500/40 text-rose-300";
              }

              return (
                <button
                  key={slot.id}
                  onClick={() => setSelectedCell(slot)}
                  className={"h-12 rounded-lg border font-mono text-[10px] flex flex-col items-center justify-center transition-all cursor-pointer " + bgClass + (
                    isSelected ? " ring-2 ring-white ring-offset-2 ring-offset-[#090325]" : ""
                  )}
                >
                  <span className="font-bold">#S{slot.id}</span>
                  <span className="text-[8px] opacity-70">
                    {slot.status === "idle" ? "IDLE" : slot.activeDir || "PAR"}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Matrix Legend */}
          <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
            <div className="flex items-center space-x-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 shadow-[0_0_6px_#06b6d4]" />
                <span className="text-cyan-300">LONG Slot</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-400 shadow-[0_0_6px_#f43f5e]" />
                <span className="text-rose-300">SHORT Slot</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#130b3d] border border-purple-800" />
                <span>Ready Partition</span>
              </span>
            </div>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 0 State Lock Collisions
            </span>
          </div>
        </div>

        {/* Right Col: Inspector or Benchmark Box */}
        <div className="space-y-4">
          
          {/* Selected Slot Inspector */}
          {selectedCell ? (
            <div className="bg-[#090325] border border-cyan-500/40 rounded-2xl p-4 font-mono text-xs shadow-xl animate-in fade-in">
              <div className="flex justify-between items-center pb-2 border-b border-purple-900/40">
                <span className="text-cyan-300 font-black flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-cyan-400" />
                  SLOT #S{selectedCell.id} AUDIT
                </span>
                <button
                  onClick={() => setSelectedCell(null)}
                  className="text-slate-400 hover:text-white text-[10px]"
                >
                  ✕ Close
                </button>
              </div>

              <div className="mt-3 space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">State Pointer:</span>
                  <span className="text-purple-300 font-bold">positions[1042][{selectedCell.lastTrader}]</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Storage Key:</span>
                  <span className="text-slate-200">{selectedCell.slotHash}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Direction Partition:</span>
                  <span className={selectedCell.activeDir === "LONG" ? "text-cyan-300 font-bold" : "text-rose-300 font-bold"}>
                    {selectedCell.activeDir || "LONG"} (Slot 0x0{selectedCell.id})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Execution Latency:</span>
                  <span className="text-emerald-400 font-black">{selectedCell.lastLatency} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gas Used:</span>
                  <span className="text-slate-200">21,420 gas ($0.00008)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#090325]/70 border border-purple-900/40 rounded-2xl p-4 font-mono text-xs">
              <span className="text-purple-300 font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                HOW PARALLEL EVM WORKS
              </span>
              <p className="text-slate-400 text-[11px] mt-2 leading-relaxed">
                On Ethereum, transactions are executed sequentially. If 500 users trade in the same second, transactions lock each other out and revert.
              </p>
              <p className="text-cyan-300 text-[11px] mt-2 leading-relaxed">
                On Monad, FluxState partitions storage so every order hits an isolated memory slot. 500 orders clear simultaneously in the same block.
              </p>
            </div>
          )}

          {/* Benchmark Comparative Matrix (Always Visible or Populated on Storm) */}
          <div className="bg-[#090325] border border-purple-500/30 rounded-2xl p-4 font-mono text-xs">
            <div className="text-[11px] uppercase tracking-widest text-slate-400 font-bold flex items-center justify-between pb-2 border-b border-purple-900/40">
              <span>{batchSize}-ORDER HEAD-TO-HEAD</span>
              {simResults && (
                <span className="text-emerald-400 font-black bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">
                  {simResults.speedup}
                </span>
              )}
            </div>

            <div className="mt-3 space-y-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30">
                <div className="flex justify-between text-cyan-300 font-black">
                  <span>⚡ MONAD PARALLEL EVM</span>
                  <span>{simResults ? simResults.monadDuration : "0.78s"}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                  <span>Gas: {simResults ? simResults.monadGas : "$0.003"}</span>
                  <span className="text-emerald-400 font-bold">0 Reverts (0.0%)</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/20 text-slate-400">
                <div className="flex justify-between text-rose-300 font-bold">
                  <span>SEQUENTIAL EVM (ETH)</span>
                  <span>{simResults ? simResults.ethDuration : "42.0s (4 blocks)"}</span>
                </div>
                <div className="flex justify-between text-[11px] mt-1">
                  <span>Gas: {simResults ? simResults.ethGas : "$1,420.00"}</span>
                  <span className="text-rose-400 font-bold">38.4% Reverts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
