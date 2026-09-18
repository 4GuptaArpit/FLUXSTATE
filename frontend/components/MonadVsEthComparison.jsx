"use client";

import React from "react";
import { Zap, AlertTriangle, Layers, Clock, DollarSign } from "lucide-react";

export default function MonadVsEthComparison() {
  const comparisons = [
    {
      metric: "Block Finality",
      monad: "1.0 Second",
      eth: "12.0 - 15.0 Seconds",
      advantage: "12x - 15x Faster",
      winner: "monad"
    },
    {
      metric: "State Write Execution",
      monad: "Parallel (Non-blocking)",
      eth: "Sequential (Bottleneck)",
      advantage: "0 Lock Conflicts",
      winner: "monad"
    },
    {
      metric: "Sub-Second Micro-Betting",
      monad: "Natively Supported",
      eth: "Impossible (Tx Delay)",
      advantage: "Unique Frontier",
      winner: "monad"
    },
    {
      metric: "Average Gas Fee",
      monad: "< $0.001 per Bet",
      eth: "$3.50 - $18.00 per Bet",
      advantage: "99.9% Savings",
      winner: "monad"
    },
    {
      metric: "Peak Throughput",
      monad: "10,000 TPS",
      eth: "15 - 30 TPS",
      advantage: "330x Scalability",
      winner: "monad"
    }
  ];

  return (
    <div className="bg-[#120D2F] border border-[#2B2155] rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-[#241A4A]">
        <div className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-purple-400" />
          <h3 className="font-bold text-sm text-white">Why FluxState Needs Monad</h3>
        </div>
        <span className="text-[10px] bg-purple-900/60 text-purple-300 font-mono px-2 py-0.5 rounded border border-purple-700">
          Architectural Moat
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        {comparisons.map((c, i) => (
          <div key={i} className="p-3 bg-[#17113A] rounded-xl border border-[#2B2354] flex flex-col md:flex-row md:items-center justify-between gap-2 font-mono text-xs">
            <span className="text-gray-300 font-semibold">{c.metric}</span>
            <div className="flex items-center space-x-3">
              <span className="text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-700/60">
                Monad: <strong>{c.monad}</strong>
              </span>
              <span className="text-gray-500">vs</span>
              <span className="text-rose-400/80 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/40">
                ETH: <strong>{c.eth}</strong>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
