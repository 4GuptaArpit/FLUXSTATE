"use client";

import React from "react";
import { Zap, XCircle, Lock, Trash2, ShieldCheck, Key } from "lucide-react";

export function SessionModal({
  show,
  onClose,
  is1ClickTrading,
  activeSession,
  sessionStorageType,
  setSessionStorageType,
  sessionPinInput,
  setSessionPinInput,
  isSubmitting,
  onAuthorizeSession,
  onLockSession,
  onRevokeSession
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]">
      <div className="bg-[#0E1015] border border-white/20 rounded-xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 font-mono">
        
        <div className="flex items-start justify-between border-b border-white/[0.08] pb-3.5">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded bg-white/5 border border-white/10 flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#CCFF00]" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">
                {is1ClickTrading && activeSession ? "Manage 1-Click Session" : "Enable 1-Click Trading"}
              </h3>
              <p className="text-[11px] font-mono text-slate-400">Zero MetaMask Popups • 50ms High-Frequency Trades</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors cursor-pointer"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {is1ClickTrading && activeSession ? (
          // Active Session Management View
          <div className="space-y-4">
            <div className="bg-[#070318] p-4 rounded-2xl border border-emerald-500/30 font-mono text-xs space-y-2">
              <div className="flex justify-between items-center text-emerald-400 font-bold">
                <span>STATUS: ACTIVE & READY</span>
                <span className="text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">ONLINE</span>
              </div>
              <div className="text-slate-400">
                Storage: <span className="text-white font-bold">{activeSession.storageType === "local" ? "Persistent 24-Hour (LocalStorage)" : "Single-Window (SessionStorage)"}</span>
              </div>
              <div className="text-slate-400">
                Session Key: <span className="text-cyan-300 font-bold">{activeSession.sessionAddress.slice(0, 10)}...{activeSession.sessionAddress.slice(-6)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onLockSession}
                className="flex-1 py-3 rounded-xl bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>{activeSession.pinHash ? "LOCK NOW" : "LOCK & CLEAR"}</span>
              </button>

              <button
                type="button"
                onClick={onRevokeSession}
                className="flex-1 py-3 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>REVOKE SESSION</span>
              </button>
            </div>
          </div>
        ) : (
          // New Session Setup View
          <div className="space-y-5">
            <div className="bg-[#070318] p-4 rounded-2xl border border-cyan-500/20 font-mono text-xs space-y-3">
              <div className="flex items-center space-x-2 text-cyan-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>SESSION KEY ARCHITECTURE & EXECUTION</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                You sign <strong>once</strong> in MetaMask to approve an ephemeral session trading keypair.
              </p>
              
              {/* Clear Environment Execution Modes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] pt-1">
                <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
                  <div className="font-bold flex items-center space-x-1">
                    <span>⚡ JUDGE PILOT SANDBOX</span>
                  </div>
                  <p className="text-slate-400 mt-0.5">Instant 50ms sub-second execution with <strong>0 MetaMask popups</strong>.</p>
                </div>

                <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">
                  <div className="font-bold flex items-center space-x-1">
                    <span>🛡️ MONAD TESTNET (L1)</span>
                  </div>
                  <p className="text-slate-400 mt-0.5">Non-custodial smart contract: transfers live MON collateral directly from your wallet.</p>
                </div>
              </div>

              <div className="border-t border-purple-900/30 pt-2 text-[10px] text-emerald-400 flex items-center space-x-1.5">
                <span>🛡️</span>
                <span>Zero-Withdrawal Guarantee: Session keys can only place & close trades. They have 0 power to move or withdraw funds.</span>
              </div>
            </div>

            {/* Storage Mode Selection */}
            <div className="space-y-2">
              <label className="text-xs font-mono font-bold text-slate-300">SESSION PERSISTENCE</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div 
                  onClick={() => setSessionStorageType("local")}
                  className={"p-3.5 rounded-xl border font-mono text-xs cursor-pointer transition-all " + (
                    sessionStorageType === "local" 
                      ? "bg-purple-950/70 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]" 
                      : "bg-[#070318] border-purple-900/40 text-slate-400"
                  )}
                >
                  <div className="font-bold flex items-center space-x-1.5">
                    <span>● Remember 24 Hours</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Persists across window close. 15-min idle auto-lock.</p>
                </div>

                <div 
                  onClick={() => setSessionStorageType("session")}
                  className={"p-3.5 rounded-xl border font-mono text-xs cursor-pointer transition-all " + (
                    sessionStorageType === "session" 
                      ? "bg-purple-950/70 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]" 
                      : "bg-[#070318] border-purple-900/40 text-slate-400"
                  )}
                >
                  <div className="font-bold flex items-center space-x-1.5">
                    <span>● Single-Window</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Key is destroyed immediately when tab or window is closed.</p>
                </div>
              </div>
            </div>

            {/* Optional Quick-PIN for 24h storage */}
            {sessionStorageType === "local" && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-300 font-bold">OPTIONAL QUICK-PIN (RECOMMENDED)</span>
                  <span className="text-[10px] text-slate-500">Auto-lock defense</span>
                </div>
                <input
                  type="password"
                  maxLength={6}
                  value={sessionPinInput}
                  onChange={(e) => setSessionPinInput(e.target.value)}
                  placeholder="Enter 4-digit PIN to lock session against intruders"
                  className="w-full bg-[#08021C] border border-purple-900/50 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none"
                />
                <p className="text-[10px] font-mono text-slate-500">
                  Protects your terminal if you walk away from your desk. Required to unlock after 15m inactivity.
                </p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onAuthorizeSession}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 font-mono font-black text-sm uppercase text-white shadow-lg shadow-purple-600/30 active:scale-95 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <Key className="w-4 h-4" />
                <span>{isSubmitting ? "SIGNING IN WALLET..." : "AUTHORIZE 1-CLICK (1 SIGNATURE)"}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
