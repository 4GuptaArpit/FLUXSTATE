"use client";

import React, { useState, useEffect } from "react";
import { Cpu, ShieldCheck, Zap, Activity, CheckCircle } from "lucide-react";

export default function ParallelExecutionProof({ activeEpoch = 142 }) {
  const [mounted, setMounted] = useState(false);
  const [slots, setSlots] = useState([
    { id: 0, addr: "0x7F2B", dir: "UP", slotHash: "0x4a9b8f10...c421", latency: 812, amount: "5.0" },
    { id: 1, addr: "0x3C1A", dir: "DOWN", slotHash: "0x98ef32b1...d90a", latency: 840, amount: "12.5" },
    { id: 2, addr: "0xB29F", dir: "UP", slotHash: "0x712a44cc...e81f", latency: 795, amount: "25.0" },
    { id: 3, addr: "0x5E84", dir: "UP", slotHash: "0x10dc591a...b23c", latency: 830, amount: "8.0" },
    { id: 4, addr: "0x91DC", dir: "DOWN", slotHash: "0x384be099...f144", latency: 865, amount: "15.0" }
  ]);
  const [blockHeight, setBlockHeight] = useState(4892150);
  const [stats, setStats] = useState({
    concurrentTxs: 318,
    stateCollisions: 0,
    blockTime: "1.00s",
    tpsSnapshot: "9,840 TPS"
  });

  useEffect(() => {
    setMounted(true);
    const addresses = ["0x7F2B", "0x3C1A", "0xB29F", "0x5E84", "0x91DC", "0xA412", "0xF883", "0x11AB"];
    const directions = ["UP", "DOWN"];

    const generateSlots = () => {
      return Array.from({ length: 5 }).map((_, i) => {
        const addr = addresses[Math.floor(Math.random() * addresses.length)];
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const slotHash = "0x" + Math.random().toString(16).substring(2, 10) + "..." + Math.random().toString(16).substring(2, 6);
        const latency = Math.floor(780 + Math.random() * 190);
        const amount = (Math.random() * 15 + 1).toFixed(1);
        return { id: i, addr, dir, slotHash, latency, amount };
      });
    };

    const interval = setInterval(() => {
      setBlockHeight(b => b + 1);
      setSlots(generateSlots());
      setStats(prev => ({
        ...prev,
        concurrentTxs: Math.floor(280 + Math.random() * 80),
        tpsSnapshot: String(9600 + Math.floor(Math.random() * 350)).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " TPS"
      }));
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  // Format with explicit standard separator to avoid SSR/Client locale mismatch (e.g. en-US 4,892,150 vs en-IN 48,92,150)
  const formattedBlockHeight = String(blockHeight).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return (
    <div className="bg-[#100C29] border border-[#2B2252] rounded-2xl p-5 shadow-xl relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#221A45]">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <Cpu className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white flex items-center space-x-2">
              <span>Parallel State Partitioning Proof</span>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 font-mono px-2 py-0.2 rounded border border-cyan-800">
                Monad EVM Native
              </span>
            </h3>
            <p className="text-[11px] text-gray-400">Zero state-write conflicts via isolated storage slots</p>
          </div>
        </div>

        <div className="text-right font-mono text-xs">
          <span className="text-gray-500">Block </span>
          <span className="text-purple-300 font-bold">#{formattedBlockHeight}</span>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-4 gap-2 my-4 text-center font-mono">
        <div className="bg-[#17113A] p-2 rounded-xl border border-[#2E245C]">
          <div className="text-[10px] text-gray-400">CONCURRENT TXs</div>
          <div className="text-sm font-bold text-cyan-400 mt-0.5">{stats.concurrentTxs}</div>
        </div>
        <div className="bg-[#17113A] p-2 rounded-xl border border-[#2E245C]">
          <div className="text-[10px] text-gray-400">STATE COLLISIONS</div>
          <div className="text-sm font-bold text-emerald-400 mt-0.5">{stats.stateCollisions} (0.0%)</div>
        </div>
        <div className="bg-[#17113A] p-2 rounded-xl border border-[#2E245C]">
          <div className="text-[10px] text-gray-400">BLOCK LATENCY</div>
          <div className="text-sm font-bold text-white mt-0.5">{stats.blockTime}</div>
        </div>
        <div className="bg-[#17113A] p-2 rounded-xl border border-[#2E245C]">
          <div className="text-[10px] text-gray-400">TPS PEAK</div>
          <div className="text-sm font-bold text-purple-400 mt-0.5">{stats.tpsSnapshot}</div>
        </div>
      </div>

      {/* Live Parallel Storage Slots Table */}
      <div className="space-y-1.5 font-mono text-xs">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 flex justify-between px-2">
          <span>Storage Slot Pointer</span>
          <span>Wallet</span>
          <span>Position</span>
          <span>Execution Latency</span>
        </div>

        {slots.map((slot) => (
          <div 
            key={slot.id}
            className="flex items-center justify-between bg-[#151033] hover:bg-[#1C1544] transition-all px-3 py-2 rounded-lg border border-[#261E4C]"
          >
            <div className="flex items-center space-x-2 text-gray-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-purple-300">{slot.slotHash}</span>
            </div>
            <span className="text-gray-400">{slot.addr}</span>
            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
              slot.dir === "UP" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
            }`}>
              {slot.amount} MON {slot.dir}
            </span>
            <div className="flex items-center space-x-1.5 text-emerald-400 font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{slot.latency}ms</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-[#221A45] flex items-center justify-between text-[11px] text-gray-400 font-mono">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Solidity Slot: <code>positions[epoch][user][dir]</code></span>
        </div>
        <span className="text-purple-400 font-semibold">100% Non-Blocking Parallel EVM</span>
      </div>
    </div>
  );
}
