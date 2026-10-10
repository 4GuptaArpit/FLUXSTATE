"use client";

import React from "react";
import { 
  Sliders, 
  XCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  BarChart2 
} from "lucide-react";

export function PositionHUD({
  activePosition,
  isPilotMode,
  isSimActive,
  setIsSimActive,
  handleClosePosition,
  currentPositionPnL,
  monPrice,
  blockFundingAccrual,
  blockFundingRateBps,
  setShowMathModal,
  assignedShardId,
  marketStats24h
}) {
  return (
    <>
      {/* Real-Time Active Position HUD or Awaiting Order Standby Sentinel */}
      {activePosition ? (
        <div className="monolith-chassis rounded-2xl p-5 relative overflow-hidden font-mono">
          <div className="flex flex-wrap justify-between items-center pb-3 border-b border-white/[0.08] gap-2">
            <div className="flex items-center space-x-3">
              <span className={"px-2.5 py-1 rounded-md text-xs font-mono font-black " + (
                activePosition.isLong 
                  ? "bg-[#00F279] text-black" 
                  : "bg-[#FF2A4D] text-white"
              )}>
                {activePosition.isLong ? "LONG" : "SHORT"} {activePosition.leverage}x
              </span>
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                MON-PERP • Epoch #{activePosition.epochId}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {isPilotMode && (
                <button
                  type="button"
                  onClick={() => setIsSimActive(!isSimActive)}
                  className={"px-3 py-1.5 rounded-lg font-mono text-xs font-bold border transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer " + (
                    isSimActive 
                      ? "bg-[#FFB800]/15 border-[#FFB800]/50 text-[#FFB800]" 
                      : "bg-white/[0.04] border-white/10 text-zinc-300 hover:text-white hover:border-white/20"
                  )}
                  title="Simulate price crashes and test liquidation thresholds directly"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#FFB800]" />
                  <span>{isSimActive ? "CLOSE STRESS SIM" : "STRESS TEST MMR"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleClosePosition}
                className="px-3.5 py-1.5 rounded-lg bg-[#FF2A4D]/10 hover:bg-[#FF2A4D]/20 border border-[#FF2A4D]/40 text-[#FF2A4D] font-mono text-xs font-black uppercase transition-all flex items-center space-x-1.5 active:scale-95 cursor-pointer"
                title="Instant Market Close [Hotkey: C]"
              >
                <XCircle className="w-3.5 h-3.5 text-[#FF2A4D]" />
                <span>Close Position</span>
                <kbd className="text-[9px] bg-black/60 text-zinc-300 px-1.5 py-0.2 rounded border border-white/10 font-bold ml-1">
                  C
                </kbd>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs font-mono">
            <div className="monolith-core p-3 rounded-xl border border-white/[0.06]">
              <div className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-1">Entry Price</div>
              <div className="text-sm font-black text-white tabular-nums">{"$" + activePosition.entryPrice.toFixed(4)}</div>
              {currentPositionPnL.breakEvenPrice > 0 && (
                <div className="text-[10px] text-zinc-400 mt-1 font-mono">
                  Break-even: <span className="text-[#CCFF00] font-bold tabular-nums">${currentPositionPnL.breakEvenPrice.toFixed(4)}</span>
                </div>
              )}
            </div>

            <div className="monolith-core p-3 rounded-xl border border-white/[0.06]">
              <div className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-1">Mark Price</div>
              <div className="text-sm font-black text-[#00E5FF] tabular-nums">{"$" + monPrice.toFixed(4)}</div>
              <div className="text-[10px] text-zinc-500 mt-1">Pyth Sub-Second Feed</div>
            </div>

            <div className="monolith-core p-3 rounded-xl border border-white/[0.06]">
              <div className="text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-1">Margin Locked</div>
              <div className="text-sm font-black text-white tabular-nums">{activePosition.margin} MON</div>
              <div className="text-[10px] text-zinc-500 mt-1">Fee: {currentPositionPnL.fee ? currentPositionPnL.fee.toFixed(3) : "0.00"} MON</div>
            </div>

            <div className={"p-3 rounded-xl border " + (
              currentPositionPnL.isProfit 
                ? "bg-[#00F279]/10 border-[#00F279]/30" 
                : "bg-[#FF2A4D]/10 border-[#FF2A4D]/30"
            )}>
              <div className="flex justify-between items-center text-zinc-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                <span>Net PnL</span>
                <span className="text-[9px] text-[#00E5FF] font-black">1-SEC FUNDING</span>
              </div>
              <div className={"text-sm font-black flex items-center tabular-nums " + (
                currentPositionPnL.isProfit ? "text-[#00F279]" : "text-[#FF2A4D]"
              )}>
                {currentPositionPnL.isProfit ? <ArrowUpRight className="w-4 h-4 mr-0.5" /> : <ArrowDownRight className="w-4 h-4 mr-0.5" />}
                {(currentPositionPnL.pnlMon >= 0 ? "+" : "") + currentPositionPnL.pnlMon.toFixed(2)} MON ({currentPositionPnL.pnlPercent.toFixed(1)}%)
              </div>
              <div className="text-[10px] text-zinc-400 mt-1.5 pt-1.5 border-t border-white/[0.08] space-y-0.5">
                <div className="flex justify-between items-center">
                  <span>Gross: <strong className="text-white tabular-nums">{(currentPositionPnL.grossPnlMon >= 0 ? "+" : "") + currentPositionPnL.grossPnlMon.toFixed(4)} MON</strong></span>
                  <span className="text-zinc-500">Fee: -{(currentPositionPnL.fee || 0.08).toFixed(2)} MON</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500">Continuous Funding:</span>
                  <span className={"font-bold tabular-nums " + (activePosition.isLong ? "text-[#FF2A4D]" : "text-[#00F279]")}>
                    {activePosition.isLong ? "-" : "+"}{blockFundingAccrual.toFixed(4)} MON
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Block Stream Funding Taximeter Ticker (Live Continuous PnL Delta) */}
          <div className="mt-3 monolith-core border border-white/[0.08] rounded-xl p-3 text-[11px] font-mono flex flex-wrap justify-between items-center text-zinc-300">
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00F279] animate-ping" />
              <span className="text-[#00F279] font-bold">Continuous Funding Stream</span>
              <span>Rate: <strong className="text-white tabular-nums">{blockFundingRateBps} / block</strong></span>
            </div>
            <div className="flex items-center space-x-3 text-[10px]">
              <span>Cadence: <strong className="text-[#00F279]">1.0s Monad Block</strong></span>
              <span className="text-[#00F279] bg-[#00F279]/10 border border-[#00F279]/30 px-2 py-0.5 rounded font-bold">✓ Continuous Settlement</span>
              <button
                type="button"
                onClick={() => setShowMathModal(true)}
                className="text-[#CCFF00] hover:text-white bg-[#CCFF00]/10 hover:bg-[#CCFF00]/20 border border-[#CCFF00]/30 px-2 py-0.5 rounded font-bold transition-colors cursor-pointer flex items-center space-x-1"
              >
                <span>📐 FORMULA INSPECTOR</span>
              </button>
              <span className="hidden md:inline text-zinc-400">
                Vault: 100% Solvent (Zero Bad Debt)
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Standby Card when no position is open (Double-Bezel Monolith Chassis) */
        <div className="monolith-chassis rounded-2xl p-5 relative overflow-hidden font-mono">
          <div className="flex flex-wrap justify-between items-center pb-3.5 border-b border-white/[0.08] gap-3">
            <div className="flex items-center space-x-2.5">
              <span className="w-2 h-2 rounded-full bg-[#00F279] animate-ping" />
              <span className="text-xs font-black text-white uppercase tracking-wider">
                Market Standby • Ready For Dispatch
              </span>
              <span className="hidden sm:inline-flex text-[10px] font-bold text-[#00F279] bg-[#00F279]/10 px-2.5 py-0.5 rounded-md border border-[#00F279]/30">
                VAULT SOLVENT
              </span>
            </div>
            <div className="flex items-center space-x-3 text-[11px] text-zinc-400">
              <span>HOTKEYS: <span className="inline-flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-black text-[10px] text-[#00F279] font-mono font-bold shadow-inner">B</kbd> LONG</span> • <span className="inline-flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-black text-[10px] text-[#FF2A4D] font-mono font-bold shadow-inner">S</kbd> SHORT</span> • <span className="inline-flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-black text-[10px] text-[#CCFF00] font-mono font-bold shadow-inner">1</kbd> 1-CLICK</span></span>
              <button
                type="button"
                onClick={() => setShowMathModal(true)}
                className="text-[#CCFF00] hover:text-white bg-[#CCFF00]/10 hover:bg-[#CCFF00]/20 border border-[#CCFF00]/30 px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer flex items-center space-x-1"
              >
                <span>📐 FORMULA INSPECTOR</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3.5 text-xs">
            <div className="monolith-core p-3 rounded-xl">
              <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Protocol Vault</div>
              <div className="text-sm font-black text-[#00F279] tabular-nums">1,500,000 MON</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">100% Solvency</div>
            </div>
            <div className="monolith-core p-3 rounded-xl">
              <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Funding Velocity</div>
              <div className="text-sm font-black text-zinc-200">1-Second Block</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Continuous skew</div>
            </div>
            <div className="monolith-core p-3 rounded-xl">
              <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Assigned Storage</div>
              <div className="text-sm font-black text-[#CCFF00] tabular-nums">Shard #{assignedShardId}</div>
              <div className="text-[10px] text-zinc-500 mt-0.5">Zero contention</div>
            </div>
            <div className="monolith-core p-3 rounded-xl">
              <div className="text-zinc-500 text-[10px] uppercase font-bold tracking-wider mb-1">Execution Track</div>
              <div className="text-sm font-black text-white">50ms Sub-Second</div>
              <div className="text-[10px] text-[#00F279] mt-0.5 font-bold">0 Popups Active</div>
            </div>
          </div>
        </div>
      )}

      {/* 24H Market Range & Liquidity Depth (Double-Bezel Monolith Chassis) */}
      <div className="monolith-chassis rounded-2xl p-4 font-mono text-xs space-y-3">
        <div className="flex justify-between items-center text-zinc-300">
          <div className="flex items-center space-x-2 font-bold text-[#00E5FF] text-xs">
            <BarChart2 className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span className="font-black uppercase tracking-wider text-[11px]">24H MARKET RANGE & LIQUIDITY DEPTH</span>
          </div>
          <span className="text-[10px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/10 font-bold">
            PYTH HERMES STREAM
          </span>
        </div>

        {/* Dynamic 24h Price Range Slider Bar */}
        <div className="space-y-1.5 monolith-core p-3 rounded-xl">
          <div className="flex justify-between text-[10px] text-zinc-400 font-medium">
            <span>24h Low: <strong className="text-white">${marketStats24h.low24h.toFixed(4)}</strong></span>
            <span>24h High: <strong className="text-white">${marketStats24h.high24h.toFixed(4)}</strong></span>
          </div>
          <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden relative border border-white/10">
            <div 
              style={{ width: `${marketStats24h.rangePercent}%` }} 
              className="h-full bg-gradient-to-r from-[#00E5FF] to-[#CCFF00] rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(204,255,0,0.4)]"
            />
          </div>
        </div>

        {/* 4-Stat Macro Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <div className="monolith-core p-2.5 rounded-xl">
            <div className="text-zinc-500 text-[10px] font-bold">All-Time High (ATH):</div>
            <div className="text-[#00F279] font-bold text-xs mt-0.5">${marketStats24h.athPrice.toFixed(4)}</div>
          </div>
          <div className="monolith-core p-2.5 rounded-xl">
            <div className="text-zinc-500 text-[10px] font-bold">Cycle Floor (ATL):</div>
            <div className="text-[#FF2A4D] font-bold text-xs mt-0.5">${marketStats24h.atlPrice.toFixed(4)}</div>
          </div>
          <div className="monolith-core p-2.5 rounded-xl">
            <div className="text-zinc-500 text-[10px] font-bold">24H Volume (Est):</div>
            <div className="text-white font-bold text-xs mt-0.5">{marketStats24h.vol24hUSD}</div>
          </div>
          <div className="monolith-core p-2.5 rounded-xl">
            <div className="text-zinc-500 text-[10px] font-bold">Market Sentiment:</div>
            <div className="text-[#CCFF00] font-bold text-xs mt-0.5">{marketStats24h.longSentiment}% L / {marketStats24h.shortSentiment}% S</div>
          </div>
        </div>
      </div>
    </>
  );
}
