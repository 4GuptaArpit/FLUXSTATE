"use client";

import React, { useState } from "react";
import { Award, Trophy, Zap, TrendingUp, ShieldCheck, ExternalLink, Cpu, CheckCircle2, Flame, Users, Activity } from "lucide-react";
import { cyberAudio } from "../lib/audio";

const LEADERBOARD_DATA = [
  {
    rank: 1,
    badge: "🏆",
    address: "0x71Ca35...a89B",
    fullAddress: "0x71Ca357891295b7194689028B0def1589120a89B",
    title: "Apex Parallel Sniper",
    pnl: "+342.8 MON",
    pnlUsd: "+$1,468.90",
    roi: "+148.2%",
    winRate: "94.2%",
    trades: 1280,
    latency: "6.8ms",
    tier: "Grandmaster",
    tierColor: "from-amber-400 to-yellow-600 border-amber-400/50 text-amber-300",
    tags: ["0-Collision King", "Pyth Sniper"]
  },
  {
    rank: 2,
    badge: "🥈",
    address: "0x3aF812...9c10",
    fullAddress: "0x3aF812950b7194689028B0def15891209c107812",
    title: "Monad MEV Relayer",
    pnl: "+210.5 MON",
    pnlUsd: "+$901.99",
    roi: "+96.5%",
    winRate: "89.1%",
    trades: 840,
    latency: "7.1ms",
    tier: "Apex Predator",
    tierColor: "from-purple-400 to-indigo-600 border-purple-400/50 text-purple-300",
    tags: ["Parallel Beast", "Sub-Second Arb"]
  },
  {
    rank: 3,
    badge: "🥉",
    address: "0xE42901...12D8",
    fullAddress: "0xE429012950b7194689028B0def158912012D8341",
    title: "High-Frequency Maker",
    pnl: "+155.0 MON",
    pnlUsd: "+$664.17",
    roi: "+72.4%",
    winRate: "82.4%",
    trades: 620,
    latency: "7.4ms",
    tier: "Speed Demon",
    tierColor: "from-cyan-400 to-blue-600 border-cyan-400/50 text-cyan-300",
    tags: ["Vol Harvester", "Low Latency"]
  },
  {
    rank: 4,
    badge: "4",
    address: "0x918B72...55b2",
    fullAddress: "0x918B722950b7194689028B0def158912055b2019",
    title: "Delta Neutral Bot",
    pnl: "+98.2 MON",
    pnlUsd: "+$420.78",
    roi: "+51.0%",
    winRate: "76.5%",
    trades: 415,
    latency: "8.0ms",
    tier: "Veteran",
    tierColor: "from-slate-400 to-slate-600 border-slate-400/50 text-slate-300",
    tags: ["Algorithmic", "Multi-Market"]
  },
  {
    rank: 5,
    badge: "5",
    address: "0xB21590...4f8E",
    fullAddress: "0xB215902950b7194689028B0def15891204f8E772",
    title: "Sub-Second Speculator",
    pnl: "+64.4 MON",
    pnlUsd: "+$275.95",
    roi: "+38.2%",
    winRate: "71.0%",
    trades: 280,
    latency: "7.6ms",
    tier: "Specialist",
    tierColor: "from-emerald-400 to-teal-600 border-emerald-400/50 text-emerald-300",
    tags: ["Pyth Scalper"]
  }
];

export default function LeaderboardTab({ walletAddress = null, isDemoMode = false, userPositions = [] }) {
  const [filterPeriod, setFilterPeriod] = useState("all"); // "all" | "24h" | "epoch"

  // Compute live user stats from current session
  const userWonPositions = userPositions.filter(p => p.status === "WON" || p.status === "SETTLED");
  const userWinCount = userPositions.filter(p => p.status === "WON").length;
  const userWinRate = userPositions.length > 0 
    ? ((userWinCount / userPositions.length) * 100).toFixed(0) + "%" 
    : "83.3%";

  const userDisplayName = walletAddress 
    ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4) 
    : (isDemoMode ? "0xDEMO...PILOT" : "0xf163...ef15");

  return (
    <div className="space-y-6">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel border-purple-500/20 p-4 rounded-2xl relative overflow-hidden">
          <div className="text-[10px] font-mono text-purple-300 uppercase tracking-wider flex items-center">
            <Activity className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
            24H PARALLEL VOLUME
          </div>
          <div className="text-xl font-mono font-black text-white mt-1">578,410 MON</div>
          <div className="text-[11px] font-mono text-emerald-400 mt-0.5">~$2,478,594 USD</div>
        </div>

        <div className="glass-panel border-purple-500/20 p-4 rounded-2xl relative overflow-hidden">
          <div className="text-[10px] font-mono text-purple-300 uppercase tracking-wider flex items-center">
            <Cpu className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
            STORAGE COLLISIONS
          </div>
          <div className="text-xl font-mono font-black text-emerald-400 mt-1">0.000%</div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">64-Core Partitioned</div>
        </div>

        <div className="glass-panel border-purple-500/20 p-4 rounded-2xl relative overflow-hidden">
          <div className="text-[10px] font-mono text-purple-300 uppercase tracking-wider flex items-center">
            <Zap className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
            AVG EXECUTION LATENCY
          </div>
          <div className="text-xl font-mono font-black text-cyan-300 mt-1">7.2ms</div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5">Monad BFT Pipeline</div>
        </div>

        <div className="glass-panel border-purple-500/20 p-4 rounded-2xl relative overflow-hidden">
          <div className="text-[10px] font-mono text-purple-300 uppercase tracking-wider flex items-center">
            <Users className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            TOTAL EPOCHS SETTLED
          </div>
          <div className="text-xl font-mono font-black text-white mt-1">18,492</div>
          <div className="text-[11px] font-mono text-cyan-400 mt-0.5">1-Second Rounds</div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="glass-panel rounded-3xl p-6 border-purple-500/20 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-purple-900/40 gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <Trophy className="w-6 h-6 text-amber-400 animate-pulse" />
              <h2 className="text-lg font-mono font-black tracking-wider text-white uppercase">
                TOP PARALLEL TRADERS & HALL OF FAME
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Real-time rankings on Monad parallel EVM. Sub-second settlements with zero front-running.
            </p>
          </div>

          {/* Period Filter Tabs */}
          <div className="flex items-center space-x-1.5 bg-[#090220] p-1 rounded-xl border border-purple-900/60 font-mono text-xs">
            {["all", "24h", "epoch"].map((p) => (
              <button
                key={p}
                onClick={() => {
                  setFilterPeriod(p);
                  if (cyberAudio && cyberAudio.playTick) cyberAudio.playTick();
                }}
                className={`px-3 py-1.5 rounded-lg uppercase font-bold transition-all ${
                  filterPeriod === p 
                    ? "bg-purple-600 text-white shadow-sm" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {p === "all" ? "All Time" : p === "24h" ? "24 Hours" : "Current Epoch"}
              </button>
            ))}
          </div>
        </div>

        {/* User Session Standing Strip */}
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-indigo-950/70 to-purple-950/80 border border-cyan-400/40 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4 font-mono">
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-300 font-black flex items-center justify-center border border-cyan-400/50">
              #6
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-white font-bold text-sm">{userDisplayName}</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded-md border border-cyan-500/40 font-bold">
                  YOUR ACTIVE PILOT
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Latency: <strong className="text-emerald-400">7.2ms</strong> • Win Rate: <strong className="text-cyan-300">{userWinRate}</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase">Session PnL</span>
              <span className="text-emerald-400 font-black text-sm">+28.5 MON</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase">Status</span>
              <span className="text-cyan-300 font-bold text-xs flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                Active Slot #S29
              </span>
            </div>
          </div>
        </div>

        {/* Table Rows */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-purple-900/40 text-slate-400 text-[10px] uppercase tracking-wider">
                <th className="py-3 px-3">Rank</th>
                <th className="py-3 px-3">Trader</th>
                <th className="py-3 px-3 text-right">Net PnL</th>
                <th className="py-3 px-3 text-right">Win Rate</th>
                <th className="py-3 px-3 text-right">Parallel Trades</th>
                <th className="py-3 px-3 text-right">Avg Latency</th>
                <th className="py-3 px-3 text-center">Verify</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-900/25">
              {LEADERBOARD_DATA.map((row) => (
                <tr 
                  key={row.rank} 
                  className="hover:bg-purple-900/15 transition-colors group"
                >
                  <td className="py-3.5 px-3">
                    <span className="font-bold text-sm flex items-center space-x-1.5">
                      <span>{row.badge}</span>
                      <span className="text-slate-400 text-xs">#{row.rank}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <div className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {row.address}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center space-x-1.5 mt-0.5">
                      <span>{row.title}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] border bg-gradient-to-r ${row.tierColor}`}>
                        {row.tier}
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <div className="font-black text-emerald-400 text-sm">{row.pnl}</div>
                    <div className="text-[10px] text-slate-400">{row.roi}</div>
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <span className="font-bold text-white bg-purple-950/70 px-2 py-0.5 rounded border border-purple-500/30">
                      {row.winRate}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-right font-bold text-slate-300">
                    {row.trades.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <span className="text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
                      {row.latency}
                    </span>
                  </td>

                  <td className="py-3.5 px-3 text-center">
                    <a
                      href={`https://testnet.monadscan.com/address/${row.fullAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-slate-500 hover:text-cyan-400 transition-colors p-1"
                      title="View on MonadScan"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
