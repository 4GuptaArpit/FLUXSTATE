"use client";

import React from "react";
import { Zap } from "lucide-react";

export function MathFormulaModal({ show, onClose, monPrice }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#090A0F] border border-white/20 rounded-2xl max-w-2xl w-full p-6 text-zinc-200 font-mono shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center space-x-2 text-[#CCFF00]">
            <Zap className="w-5 h-5 text-[#CCFF00]" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Continuous Funding Mathematical Engine</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded hover:bg-white/10 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-xs leading-relaxed">
          <p className="text-zinc-300">
            Unlike legacy perpetual DEXs on Ethereum or Arbitrum which apply coarse 1-hour or 8-hour discrete funding lumps, <strong>FluxState</strong> executes a continuous mathematical integral updated on every 1-second Monad block:
          </p>

          {/* Formula Display Box */}
          <div className="bg-black/60 border border-[#CCFF00]/30 rounded-xl p-4 text-center space-y-2">
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Continuous Funding Integral Form</div>
            <div className="text-base font-black text-[#CCFF00] font-mono tracking-wide py-1">
              F(t) = ∫ [ (OI_long - OI_short) / max(OI_total, $50,000) ] × BaseRate · dt
            </div>
            <div className="text-[10px] text-zinc-400">
              Discretized on Monad into exact 1-second block state increments (dt = 1s, Bounded |ΔF| ≤ 0.05% / block)
            </div>
          </div>

          {/* Live Parameters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
            <div className="bg-white/[0.03] border border-white/10 p-2.5 rounded-lg">
              <div className="text-[10px] text-zinc-500 font-bold uppercase">Mark Price (Pyth)</div>
              <div className="text-sm font-black text-white tabular-nums">${monPrice?.toFixed(4)}</div>
              <div className="text-[9px] text-[#00F279]">Sub-380ms Hermes Feed</div>
            </div>

            <div className="bg-white/[0.03] border border-white/10 p-2.5 rounded-lg">
              <div className="text-[10px] text-zinc-500 font-bold uppercase">Virtual OI Floor</div>
              <div className="text-sm font-black text-[#CCFF00] tabular-nums">50,000 MON</div>
              <div className="text-[9px] text-zinc-400">Zero-Division Immunity</div>
            </div>

            <div className="bg-white/[0.03] border border-white/10 p-2.5 rounded-lg">
              <div className="text-[10px] text-zinc-500 font-bold uppercase">Cadence & Gas</div>
              <div className="text-sm font-black text-[#00F279] tabular-nums">1.0s / &lt; $0.0001</div>
              <div className="text-[9px] text-zinc-400">&lt; $0.05 / day total overhead</div>
            </div>
          </div>

          {/* Economic Inevitability Table */}
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-3 space-y-1.5 text-[11px]">
            <div className="font-bold text-white flex justify-between">
              <span>Economic Inevitability on Monad:</span>
              <span className="text-[#00F279]">86,400 Updates / Day</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Ethereum L1 (86.4k checkpoints @ 70k gas):</span>
              <span className="text-rose-400 font-bold">~$14,400 / day (Impossible)</span>
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Arbitrum One (Hourly funding fallback):</span>
              <span className="text-amber-400 font-bold">~$480 / day (Coarse Lag)</span>
            </div>
            <div className="flex justify-between text-zinc-200 font-bold border-t border-white/10 pt-1">
              <span>Monad Metropolis (1s Continuous Integral):</span>
              <span className="text-[#00F279]">&lt; $0.05 / day (⚡ Native EVM Fit)</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black uppercase text-xs transition-colors cursor-pointer"
          >
            ACKNOWLEDGE & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
