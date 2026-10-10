"use client";

import React from "react";
import { 
  Sliders, 
  Lock, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Crosshair, 
  XCircle 
} from "lucide-react";

export function OrderCockpit({
  isPilotMode,
  userBalance,
  formatBalance,
  margin,
  setMargin,
  marginNum,
  leverage,
  setLeverage,
  notionalSize,
  monPrice,
  is1ClickTrading,
  activeSession,
  handleToggle1Click,
  activePosition,
  isSubmitting,
  handleOpenPosition,
  handleClosePosition,
  currentPositionPnL,
  isBracketEnabled,
  setIsBracketEnabled,
  tpPercent,
  setTpPercent,
  slPercent,
  setSlPercent,
  bracketTargets,
  bufferPercent,
  mmrAmount,
  marginBuffer,
  liqPriceLong,
  liqDistanceLongPct,
  liqPriceShort,
  liqDistanceShortPct,
  feeAmount
}) {
  return (
    <div className="monolith-chassis rounded-2xl p-5 relative overflow-hidden">
      <div>
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#CCFF00]/10 border border-[#CCFF00]/30 flex items-center justify-center">
              <Sliders className="w-3.5 h-3.5 text-[#CCFF00]" />
            </div>
            <div>
              <h3 className="font-mono font-black text-xs uppercase tracking-wider text-white">
                Order Cockpit • MON-USD
              </h3>
              <p className="text-[10px] text-zinc-400 font-mono">1.0s Single-Slot Finality</p>
            </div>
          </div>
          
          {/* 1-Click Session Key Interactive Switch */}
          <button
            type="button"
            onClick={handleToggle1Click}
            className={"group flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-[11px] font-mono cursor-pointer transition-all duration-300 " + (
              is1ClickTrading 
                ? (activeSession?.isLocked 
                    ? "bg-[#FFB800]/10 border-[#FFB800] text-[#FFB800] shadow-[0_0_15px_rgba(255,184,0,0.25)]"
                    : "bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF] shadow-[0_0_18px_rgba(0,229,255,0.25)]") 
                : "bg-white/[0.03] border-white/10 text-zinc-300 hover:border-[#CCFF00]/60 hover:text-white"
            )}
            title={is1ClickTrading 
              ? (activeSession?.isLocked 
                  ? "Session Key Locked: Click to unlock with PIN" 
                  : (isPilotMode 
                      ? "1-Click Active (Sandbox): 0 MetaMask popups enabled" 
                      : "1-Click Active (Testnet): Session key active for Monad L1 trades")) 
              : "Enable 1-Click Trading Session Key"}
          >
            {is1ClickTrading ? (
              activeSession?.isLocked ? (
                <Lock className="w-3.5 h-3.5 text-[#FFB800] animate-pulse" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-[#00E5FF] animate-pulse" />
              )
            ) : (
              <Zap className="w-3.5 h-3.5 text-[#CCFF00] group-hover:scale-110 transition-transform" />
            )}

            <span className="font-black tracking-tight text-[10px]">
              {is1ClickTrading 
                ? (activeSession?.isLocked ? "LOCKED" : "1-CLICK ON") 
                : "1-CLICK"}
            </span>

            {/* Visual Toggle Pill Indicator */}
            <div className={"w-7 h-3.5 rounded-full p-0.5 flex items-center transition-colors duration-300 " + (
              is1ClickTrading
                ? (activeSession?.isLocked ? "bg-[#FFB800] justify-end" : "bg-[#00E5FF] justify-end")
                : "bg-white/10 justify-start group-hover:bg-white/20"
            )}>
              <div className={"w-2.5 h-2.5 rounded-full bg-black shadow-md transform transition-transform duration-300 " + (
                is1ClickTrading ? "scale-100" : "scale-90 bg-zinc-400"
              )} />
            </div>
          </button>
        </div>

        {/* Collateral Input with Custom Steppers */}
        <div className="mt-4 monolith-core p-3.5 rounded-xl font-mono">
          <div className="flex justify-between text-[11px] text-zinc-400 mb-2">
            <span className="font-bold uppercase tracking-wider text-[10px]">MARGIN COLLATERAL</span>
            <span className="text-[#00E5FF] font-black tabular-nums">BALANCE: {formatBalance(userBalance, 4)} MON</span>
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
              className="w-full bg-[#080A0E] border border-white/10 focus:border-[#CCFF00] rounded-xl px-4 py-3 text-xl font-mono text-white font-bold focus:outline-none transition-colors pr-24 shadow-inner"
              placeholder="10"
            />
            <div className="absolute right-3 flex items-center space-x-2">
              <span className="text-xs text-[#CCFF00] font-mono font-black pointer-events-none">MON</span>
              <div className="flex flex-col border border-white/10 rounded-md overflow-hidden bg-[#121620]">
                <button
                  type="button"
                  onClick={() => setMargin((prev) => (Math.max(1, (parseFloat(prev) || 0) + 1)).toString())}
                  className="px-2 py-0.5 text-[9px] hover:bg-[#CCFF00]/20 text-[#CCFF00] transition-colors font-bold cursor-pointer"
                  title="Increase Margin"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => setMargin((prev) => (Math.max(1, (parseFloat(prev) || 0) - 1)).toString())}
                  className="px-2 py-0.5 text-[9px] hover:bg-[#CCFF00]/20 text-[#CCFF00] transition-colors font-bold border-t border-white/10 cursor-pointer"
                  title="Decrease Margin"
                >
                  ▼
                </button>
              </div>
            </div>
          </div>

          {/* Quick Collateral Sizing Pills (25%, 50%, 75%, MAX) */}
          <div className="grid grid-cols-4 gap-2 mt-2.5 font-mono text-[11px]">
            {[
              { label: "25%", pct: 0.25 },
              { label: "50%", pct: 0.50 },
              { label: "75%", pct: 0.75 },
              { label: "MAX", pct: 1.00 }
            ].map(({ label, pct }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (userBalance <= 0) {
                    setMargin("0.1");
                    return;
                  }
                  let calculated;
                  if (pct === 1.00) {
                    const maxAvailable = isPilotMode 
                      ? userBalance 
                      : Math.max(0.01, userBalance - 0.05);
                    calculated = Math.max(0.01, Math.floor(maxAvailable * 100) / 100);
                  } else {
                    const base = isPilotMode ? userBalance : Math.max(0, userBalance - 0.03);
                    calculated = Math.max(0.1, Math.floor(base * pct * 100) / 100);
                  }
                  setMargin(calculated.toString());
                }}
                className="py-1.5 rounded-lg bg-white/[0.04] hover:bg-[#CCFF00]/10 border border-white/[0.08] hover:border-[#CCFF00]/50 text-zinc-300 hover:text-white font-bold transition-all text-center active:scale-95 cursor-pointer"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Leverage Multiplier Calibrated Slider */}
        <div className="mt-4 monolith-core p-3.5 rounded-xl font-mono">
          <div className="flex justify-between items-center text-xs mb-2">
            <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">LEVERAGE MULTIPLIER</span>
            <span className="font-black text-[#CCFF00] text-base tabular-nums">{leverage}x</span>
          </div>
          <input
            type="range"
            min="1.1"
            max="50"
            step="0.5"
            value={leverage}
            onChange={(e) => setLeverage(parseFloat(e.target.value))}
            className="w-full accent-[#CCFF00] cursor-pointer h-2 bg-black/60 rounded-lg border border-white/5"
          />
          <div className="grid grid-cols-5 gap-1 text-xs text-zinc-400 mt-2.5">
            {[2, 5, 10, 25, 50].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setLeverage(val)}
                className={"py-1 rounded-md border text-center font-bold transition-all cursor-pointer " + (
                  leverage === val 
                    ? "border-[#CCFF00] text-black bg-[#CCFF00] font-black shadow-sm" 
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:text-white"
                )}
              >
                {val}x
              </button>
            ))}
          </div>
        </div>

        {/* Primary Instant Order Dispatch Buttons or Direct Close Trigger */}
        <div className="mt-4 space-y-2.5 font-mono">
          {activePosition ? (
            /* Immediate Cockpit Close & Settle Button (ZERO SCROLL NEEDED) */
            <div className="space-y-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleClosePosition}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-rose-600 via-rose-500 to-[#FF2A4D] hover:brightness-110 font-black text-sm text-white flex items-center justify-between px-5 active:scale-[0.98] transition-all disabled:opacity-40 cursor-pointer shadow-[0_8px_24px_-4px_rgba(255,42,77,0.5)] group border border-rose-400/30"
                title="Instantly close active position and settle PnL to wallet [Hotkey: C]"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded-md bg-black/30 flex items-center justify-center">
                    <XCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="tracking-wide">CLOSE & SETTLE PAYOUT</span>
                  <kbd className="text-[10px] bg-black text-rose-300 px-2 py-0.5 rounded font-black shadow-inner border border-rose-400/30">
                    C
                  </kbd>
                </div>
                <span className="text-[10px] bg-black/30 px-2.5 py-1 rounded-md font-black tabular-nums border border-white/10">
                  {currentPositionPnL.isProfit ? "+" : ""}{currentPositionPnL.pnlMon.toFixed(2)} MON
                </span>
              </button>
              <p className="text-[10px] text-zinc-400 text-center">
                Position Active: <strong className={activePosition.isLong ? "text-[#00F279]" : "text-[#FF2A4D]"}>{activePosition.isLong ? "LONG" : "SHORT"} {activePosition.leverage}x</strong> • Click above or press <kbd className="text-zinc-300 font-bold">C</kbd> to exit.
              </p>
            </div>
          ) : (
            <>
              <button
                type="button"
                disabled={isSubmitting || marginNum <= 0}
                onClick={() => handleOpenPosition(true)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00D96C] to-[#00F279] hover:brightness-110 font-black text-sm text-black flex items-center justify-between px-5 active:scale-[0.98] transition-all disabled:opacity-40 cursor-pointer shadow-[0_8px_20px_-4px_rgba(0,242,121,0.4)] group"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded-md bg-black/20 flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 text-black" />
                  </div>
                  <span>BUY / LONG {leverage}x</span>
                  <kbd className="text-[10px] bg-black text-[#00F279] px-2 py-0.5 rounded font-black shadow-inner">
                    B
                  </kbd>
                </div>
                <span className="text-[10px] bg-black/20 px-2.5 py-1 rounded-md font-black tabular-nums border border-black/10">
                  1.0s MONAD TX
                </span>
              </button>

              <button
                type="button"
                disabled={isSubmitting || marginNum <= 0}
                onClick={() => handleOpenPosition(false)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#E6193C] to-[#FF2A4D] hover:brightness-110 font-black text-sm text-white flex items-center justify-between px-5 active:scale-[0.98] transition-all disabled:opacity-40 cursor-pointer shadow-[0_8px_20px_-4px_rgba(255,42,77,0.4)] group"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded-md bg-black/30 flex items-center justify-center">
                    <TrendingDown className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span>SELL / SHORT {leverage}x</span>
                  <kbd className="text-[10px] bg-black text-[#FF2A4D] px-2 py-0.5 rounded font-black shadow-inner">
                    S
                  </kbd>
                </div>
                <span className="text-[10px] bg-black/30 px-2.5 py-1 rounded-md font-black tabular-nums border border-white/10">
                  1.0s MONAD TX
                </span>
              </button>
            </>
          )}
        </div>

        {/* Smart Bracket Controls (TP / SL Guard) */}
        <div className="mt-4 monolith-core rounded-xl p-3.5 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crosshair className="w-4 h-4 text-[#CCFF00]" />
              <span className="font-bold text-white tracking-wide uppercase text-[11px]">
                SMART BRACKET (TP / SL GUARD)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsBracketEnabled(!isBracketEnabled)}
              role="switch"
              aria-checked={isBracketEnabled}
              className={"group flex items-center gap-2 px-2 py-1 rounded-lg border text-[10px] font-bold tracking-wider transition-all cursor-pointer select-none active:scale-95 " + (
                isBracketEnabled 
                  ? "bg-[#CCFF00]/10 border-[#CCFF00]/40 text-[#CCFF00] hover:border-[#CCFF00]/70 hover:bg-[#CCFF00]/15" 
                  : "bg-white/[0.03] border-white/10 text-zinc-400 hover:text-zinc-200 hover:border-white/20"
              )}
              title={isBracketEnabled ? "Click to disarm Smart Bracket" : "Click to arm Take Profit / Stop Loss bracket guard"}
            >
              <span className="flex items-center gap-1.5">
                <span className={"w-1.5 h-1.5 rounded-full transition-colors " + (
                  isBracketEnabled ? "bg-[#CCFF00] shadow-[0_0_6px_#CCFF00] animate-pulse" : "bg-zinc-600"
                )} />
                <span className="text-[9.5px] uppercase font-black">
                  {isBracketEnabled ? "ARMED" : "OFF"}
                </span>
              </span>

              {/* Tactile Hardware Toggle Switch Pill */}
              <div 
                className={"w-7 h-4 rounded-full p-0.5 transition-colors flex items-center " + (
                  isBracketEnabled ? "bg-[#CCFF00]" : "bg-zinc-700/80 group-hover:bg-zinc-600"
                )}
              >
                <div 
                  className={"w-3 h-3 rounded-full bg-black shadow-sm transition-transform duration-200 ease-out " + (
                    isBracketEnabled ? "translate-x-3" : "translate-x-0"
                  )} 
                />
              </div>
            </button>
          </div>

          {isBracketEnabled && (
            <div className="space-y-3 pt-2 border-t border-white/[0.06]">
              {/* Take Profit Setting */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Target Profit (TP):</span>
                  <span className="text-[#00FF66] font-bold tabular-nums">
                    +{tpPercent}% (+{bracketTargets.estimatedTpPnlMon} MON / +${bracketTargets.estimatedTpPnlUSD})
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                  {[25, 50, 75, 100].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTpPercent(val)}
                      className={"py-1 rounded border text-center transition-colors font-bold cursor-pointer " + (
                        tpPercent === val 
                          ? "bg-[#00FF66]/10 border-[#00FF66] text-[#00FF66]" 
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                      )}
                    >
                      +{val}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Stop Loss Guard Setting */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Stop Loss Guard (SL):</span>
                  <span className="text-rose-400 font-bold tabular-nums">
                    -{slPercent}% (-{bracketTargets.estimatedSlPnlMon} MON / -${bracketTargets.estimatedSlPnlUSD})
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                  {[10, 20, 30, 40].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setSlPercent(val)}
                      className={"py-1 rounded border text-center transition-colors font-bold cursor-pointer " + (
                        slPercent === val 
                          ? "bg-rose-500/10 border-rose-500 text-rose-400" 
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                      )}
                    >
                      -{val}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Bracket Price Projections Table */}
              <div className="bg-[#141722] p-2.5 rounded-lg border border-white/[0.04] space-y-1 text-[10px]">
                <div className="flex justify-between text-slate-300">
                  <span>Long Target TP:</span>
                  <strong className="text-[#00FF66] font-mono tabular-nums">${bracketTargets.longTpPrice.toFixed(4)}</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Long Guard SL:</span>
                  <strong className="text-rose-400 font-mono tabular-nums">${bracketTargets.longSlPrice.toFixed(4)}</strong>
                </div>
                <div className="flex justify-between text-slate-400 pt-1 border-t border-white/[0.04]">
                  <span>Risk/Reward Ratio:</span>
                  <strong className="text-white font-mono">1 : {(tpPercent / Math.max(1, slPercent)).toFixed(2)}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Institutional Margin & Safety Diagnostic Card */}
        <div className="mt-4 bg-[#0C0E15] rounded-xl p-3.5 space-y-2.5 text-xs font-mono border border-white/[0.08]">
          <div className="flex justify-between items-center pb-2 border-b border-white/[0.06]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              INSTITUTIONAL MARGIN & SAFETY PRE-FLIGHT
            </span>
            <span className={"text-[10px] font-bold px-1.5 py-0.5 rounded border " + (
              bufferPercent > 40 
                ? "text-[#00FF66] bg-[#00FF66]/10 border-[#00FF66]/30" 
                : bufferPercent > 20 
                  ? "text-amber-400 bg-amber-950/40 border-amber-500/30" 
                  : "text-rose-400 bg-rose-950/40 border-rose-500/30"
            )}>
              {bufferPercent > 40 ? "SAFE" : bufferPercent > 20 ? "MODERATE" : "HIGH LEV"}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-400">Position Notional:</span>
            <span className="font-bold text-white tabular-nums">{"$" + (notionalSize * monPrice).toFixed(2) + " USD"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Maintenance Margin (2% MMR):</span>
            <span className="font-bold text-amber-300 tabular-nums">{mmrAmount.toFixed(4)} MON</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Free Margin Buffer:</span>
            <span className="font-bold text-[#00FF66] tabular-nums">+{marginBuffer.toFixed(4)} MON ({bufferPercent.toFixed(1)}%)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Est. Liq Price (Long):</span>
            <span className="font-bold text-emerald-400 tabular-nums">
              {"$" + liqPriceLong.toFixed(4)} <span className="text-[10px] text-slate-400">(-{liqDistanceLongPct.toFixed(1)}%)</span>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Est. Liq Price (Short):</span>
            <span className="font-bold text-rose-400 tabular-nums">
              {"$" + liqPriceShort.toFixed(4)} <span className="text-[10px] text-slate-400">(+{liqDistanceShortPct.toFixed(1)}%)</span>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Protocol Fee (0.08%):</span>
            <span className="text-slate-300 tabular-nums">{feeAmount.toFixed(4)} MON</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-white/[0.06]">
            <span className="text-slate-400">Est. Monad L1 Gas:</span>
            <span className="text-[#CCFF00] font-bold tabular-nums">~0.002 MON (&lt; $0.01)</span>
          </div>
        </div>

      </div>
    </div>
  );
}
