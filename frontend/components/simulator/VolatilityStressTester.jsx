"use client";

import React from "react";
import { ShieldAlert } from "lucide-react";

export function VolatilityStressTester({
  isPilotMode,
  activePosition,
  isSimActive,
  setIsSimActive,
  simPriceShift,
  setSimPriceShift,
  simBasePrice,
  setSimBasePrice,
  monPrice,
  effectivePrice,
  positionHealthFactor,
  userBalance,
  setSandboxHistory,
  setActivePosition,
  setTxToast
}) {
  if (!isPilotMode || !activePosition) return null;

  const handleSimulateLiquidation = () => {
    const bounty = +(activePosition.margin * 0.05).toFixed(4);
    const liqHistoryEntry = {
      id: activePosition.epochId,
      txHash: null,
      type: activePosition.isLong ? "LONG (LIQ)" : "SHORT (LIQ)",
      leverage: activePosition.leverage,
      margin: activePosition.margin,
      entryPrice: activePosition.entryPrice,
      exitPrice: effectivePrice,
      funding: -(
        (activePosition.margin * activePosition.leverage * 0.000024) *
        Math.max(1, (Date.now() - (activePosition.startTime || Date.now())) / 1000)
      ).toFixed(4),
      pnl: -activePosition.margin,
      pnlPercent: "-100.0%",
      isWin: false,
      balanceBefore: activePosition.balanceBefore != null ? +activePosition.balanceBefore.toFixed(4) : +userBalance.toFixed(4),
      balanceAfter: +userBalance.toFixed(4),
      fee: activePosition.fee ? +activePosition.fee.toFixed(4) : +(activePosition.margin * activePosition.leverage * 0.0008).toFixed(4),
      gasFee: "< 0.002",
      time: "Just now"
    };

    setSandboxHistory((prev) => {
      const updated = [liqHistoryEntry, ...prev.slice(0, 9)];
      if (typeof window !== "undefined") {
        localStorage.setItem("flux_sandbox_history", JSON.stringify(updated));
      }
      return updated;
    });

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
    setSimBasePrice(null);
    setTimeout(() => setTxToast(null), 5000);
  };

  return (
    <div className="mt-4 bg-[#07011D] border border-amber-500/40 rounded-2xl p-4 space-y-3 shadow-[0_0_20px_rgba(245,158,11,0.15)] font-mono">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-amber-300 font-bold text-xs">
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
          className={"px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer " + (
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
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
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
            <div className="flex justify-between text-[9px] text-slate-500 mt-1">
              <span>-40% FLASH CRASH</span>
              <span>0%</span>
              <span>+40% PUMP</span>
            </div>
          </div>

          {/* Preset Shift Buttons */}
          <div className="grid grid-cols-5 gap-1 text-[9px]">
            {[-25, -10, 0, 10, 25].map((shiftVal) => (
              <button
                key={shiftVal}
                type="button"
                onClick={() => setSimPriceShift(shiftVal)}
                className={"py-1 rounded border text-center transition-colors cursor-pointer " + (
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
              <div className="flex justify-between text-[10px]">
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
              onClick={handleSimulateLiquidation}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 font-black text-xs text-white shadow-lg shadow-rose-600/50 animate-pulse active:scale-95 transition-all cursor-pointer"
            >
              ⚡ SIMULATE KEEPER LIQUIDATION
            </button>
          )}
        </div>
      )}
    </div>
  );
}
