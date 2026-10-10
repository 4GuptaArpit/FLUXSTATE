"use client";

import React, { useState } from "react";
import { FileText, XCircle, ExternalLink, Check, Share2 } from "lucide-react";
import { CONTRACT_ADDRESSES } from "../../lib/web3";

export function SettlementSlipModal({ trade, onClose }) {
  const [copiedSlip, setCopiedSlip] = useState(false);

  if (!trade) return null;

  const handleCopy = () => {
    const slipText = `FLUXSTATE SETTLEMENT SLIP\n-------------------------\nInstrument: MON-PERP (${trade.type} ${trade.leverage}x)\nEntry: $${trade.entryPrice?.toFixed(4)} | Exit: $${trade.exitPrice?.toFixed(4)}\nNet PnL: ${trade.pnl >= 0 ? "+" : ""}${trade.pnl} MON (${trade.pnlPercent})\nSettlement: Continuous 1-Sec Block Funding\nNetwork: Monad L1 Testnet (Chain ID 10143)\nContract: 0xD822AA6f187dC05c5e95b34E4FBEDCEbBEBcDcC5`;
    navigator.clipboard.writeText(slipText);
    setCopiedSlip(true);
    setTimeout(() => setCopiedSlip(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[10002]">
      <div className="bg-[#0C0E15] border border-white/20 rounded-2xl max-w-md w-full shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden font-mono animate-in fade-in zoom-in-95 duration-150">
        {/* Header with Monad L1 Verification Chip */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#11131C]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded bg-white/5 border border-white/10">
              <FileText className="w-4 h-4 text-[#CCFF00]" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                INSTITUTIONAL SETTLEMENT SLIP
              </h3>
              <div className="text-[10px] text-slate-400">
                FLUXSTATE PROTOCOL • MONAD L1 (10143)
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors cursor-pointer"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Slip Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Highlight Result Card */}
          <div className={"p-4 rounded-xl border text-center " + (
            trade.isWin 
              ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-400" 
              : "bg-rose-950/20 border-rose-500/40 text-rose-400"
          )}>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">
              NET SETTLED RETURN (PnL)
            </div>
            <div className="text-2xl font-bold tabular-nums">
              {(trade.pnl >= 0 ? "+" : "") + trade.pnl} MON
            </div>
            <div className="text-xs font-bold mt-0.5">
              {trade.pnlPercent}
            </div>
          </div>

          {/* Execution Specs Grid */}
          <div className="bg-[#141722] rounded-xl p-3.5 space-y-2 border border-white/[0.06] text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Instrument:</span>
              <strong className="text-white">MON-PERP / USD</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Position Type:</span>
              <span className={"font-bold px-1.5 py-0.2 rounded " + (
                trade.type === "LONG" 
                  ? "text-emerald-400 bg-emerald-950/40 border border-emerald-500/30" 
                  : "text-rose-400 bg-rose-950/40 border border-rose-500/30"
              )}>
                {trade.type} {trade.leverage}x
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Epoch ID:</span>
              <span className="text-slate-200 tabular-nums">#{trade.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Entry Price:</span>
              <span className="text-white font-mono tabular-nums">${trade.entryPrice?.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Exit Price:</span>
              <span className="text-white font-mono tabular-nums">${trade.exitPrice?.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Collateral Margin:</span>
              <span className="text-slate-200 tabular-nums">{trade.margin} MON</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Accrued Continuous Funding:</span>
              <span className={"tabular-nums font-bold " + (
                trade.funding > 0 ? "text-emerald-400" : "text-rose-400"
              )}>
                {trade.funding ? `${trade.funding > 0 ? "+" : ""}${trade.funding} MON` : "Settled (1.0s Rate)"}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-white/[0.06]">
              <span className="text-slate-400">Settlement Finality:</span>
              <span className="text-[#00FF66] font-bold">1.0s Monad Block Finality</span>
            </div>
          </div>

          {/* MonadScan Verification Explorer Link & Hash */}
          <div className="bg-[#11131C] p-3 rounded-lg border border-white/[0.06] text-[10px] space-y-1">
            <div className="text-slate-400">Cryptographic Verification:</div>
            <div className="flex justify-between items-center text-slate-300">
              <span className="font-mono">{trade.txHash ? `${trade.txHash.slice(0, 14)}...${trade.txHash.slice(-8)}` : `Simulated Monad Tx: 0x${Math.abs(trade.id * 17921).toString(16)}...`}</span>
              <a
                href={trade.txHash ? `https://testnet.monadscan.com/tx/${trade.txHash}` : `https://testnet.monadscan.com/address/${CONTRACT_ADDRESSES.market}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#CCFF00] hover:underline flex items-center gap-1 font-bold"
              >
                <span>{trade.txHash ? "View Tx" : "MonadScan"}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Action Buttons: Copy Proof Slip & Close */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              className="py-2.5 rounded bg-white/5 hover:bg-white/10 border border-white/20 text-white font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
            >
              {copiedSlip ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#00FF66]" />
                  <span className="text-[#00FF66]">COPIED!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#CCFF00]" />
                  <span>SHARE SLIP</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 rounded bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black uppercase transition-colors cursor-pointer"
            >
              DONE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
