"use client";

import React from "react";
import { Lock, Zap, ShieldAlert } from "lucide-react";

export function UnlockModal({
  showUnlockModal,
  isTerminalLocked,
  showSessionExpiredModal,
  activeSession,
  unlockPinInput,
  setUnlockPinInput,
  unlockError,
  unlockLockedUntil,
  walletAddress,
  onUnlockSession,
  onRevokeSession,
  onReauthorizeSession,
  onResumeTerminal,
  onDisconnectWallet,
  onCloseSessionExpired,
  onReenable1Click
}) {
  return (
    <>
      {/* Inactivity Auto-Lock Screen Overlay (1-Click Session Mode) */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 z-[10001]">
          <div className="bg-[#0C0626] border border-amber-500/40 rounded-3xl p-8 max-w-md w-full shadow-[0_0_60px_rgba(251,191,36,0.25)] space-y-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-950/80 border border-amber-400/60 flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h3 className="font-mono font-black text-xl text-white">TERMINAL LOCKED</h3>
              <p className="text-xs font-mono text-slate-400">Locked due to 15 minutes of inactivity</p>
            </div>

            <div className="bg-[#070318] p-4 rounded-2xl border border-purple-900/40 text-xs font-mono text-slate-300">
              Your trading session is paused to prevent unauthorized orders while unattended.
            </div>

            {activeSession?.pinHash ? (
              <div className="space-y-3">
                <input
                  type="password"
                  maxLength={6}
                  value={unlockPinInput}
                  disabled={Boolean(unlockLockedUntil && Date.now() < unlockLockedUntil)}
                  onChange={(e) => setUnlockPinInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") onUnlockSession(); }}
                  placeholder="Enter 4-digit Quick-PIN"
                  className="w-full bg-[#08021C] border border-amber-500/50 focus:border-amber-400 rounded-xl px-4 py-3 text-center text-lg tracking-widest font-mono text-white focus:outline-none disabled:opacity-50"
                  autoFocus
                />
                {unlockError && (
                  <div className="text-xs font-mono text-rose-400 bg-rose-950/40 border border-rose-500/30 p-2 rounded-lg">{unlockError}</div>
                )}
                <button
                  onClick={onUnlockSession}
                  disabled={Boolean(unlockLockedUntil && Date.now() < unlockLockedUntil)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 font-mono font-bold text-xs uppercase text-black shadow-lg shadow-amber-600/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  UNLOCK TERMINAL
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-mono text-slate-400">
                  {activeSession?.storageType === "local" 
                    ? "24-Hour session without a PIN requires wallet re-authorization to unlock." 
                    : "Single-window sessions cannot be resumed without wallet re-authorization."}
                </p>
                <button
                  onClick={onReauthorizeSession}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 font-mono font-bold text-xs uppercase text-white shadow-lg shadow-cyan-600/30 transition-all active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>RE-AUTHORIZE WITH WALLET</span>
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-purple-900/30">
              <button
                onClick={onRevokeSession}
                className="text-xs font-mono text-rose-400 hover:text-rose-300 underline cursor-pointer"
              >
                Revoke Session & Disconnect 1-Click
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Inactivity Terminal Lock Overlay (Standard Wallet Mode) */}
      {isTerminalLocked && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 z-[10001] font-mono">
          <div className="bg-[#090B0F] border border-amber-500/40 rounded-xl p-7 max-w-md w-full shadow-[0_0_60px_rgba(251,191,36,0.2)] space-y-5 text-center">
            <div className="w-14 h-14 rounded-lg bg-amber-950/80 border border-amber-400/50 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7 text-amber-400 animate-pulse" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">UNATTENDED SCREEN PROTECTION</span>
              <h3 className="font-bold text-lg text-zinc-100">TERMINAL LOCKED</h3>
              <p className="text-xs text-zinc-400">Locked to prevent unauthorized trading while away from desk</p>
            </div>

            <div className="bg-[#060709] p-3.5 rounded-lg border border-white/10 text-xs text-zinc-300 text-left space-y-2">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-500">Connected Wallet:</span>
                <span className="text-zinc-200 font-bold tabular-nums">
                  {walletAddress ? walletAddress.slice(0, 6) + "..." + walletAddress.slice(-4) : "—"}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-500">Status:</span>
                <span className="text-amber-400 font-bold">Trading Inputs Frozen</span>
              </div>
              <div className="text-[10px] text-zinc-500 pt-1.5 border-t border-white/[0.06]">
                Non-Custodial: Funds remain 100% safe inside Monad smart contract vault.
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={onResumeTerminal}
                className="w-full py-3 rounded border border-amber-500/40 bg-amber-500 hover:bg-amber-400 font-mono font-bold text-xs uppercase tracking-wider text-black shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98] cursor-pointer"
              >
                RESUME TRADING SESSION
              </button>
              <button
                onClick={onDisconnectWallet}
                className="w-full py-2 text-xs text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                Disconnect Wallet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Expired (Inactivity Auto-Wipe) Modal for Single-Window Mode */}
      {showSessionExpiredModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 z-[10001]">
          <div className="bg-[#0C0626] border border-rose-500/40 rounded-3xl p-8 max-w-md w-full shadow-[0_0_60px_rgba(244,63,94,0.25)] space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-400/60 flex items-center justify-center mx-auto shadow-lg shadow-rose-600/30">
              <ShieldAlert className="w-8 h-8 text-rose-400 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h3 className="font-mono font-black text-xl text-white">SESSION EXPIRED</h3>
              <p className="text-xs font-mono text-rose-400">Auto-wiped due to 15 minutes of inactivity</p>
            </div>

            <div className="bg-[#070318] p-4 rounded-2xl border border-purple-900/40 text-xs font-mono text-slate-300 leading-relaxed text-left space-y-2">
              <div className="flex items-center space-x-2 text-rose-300 font-bold">
                <Lock className="w-3.5 h-3.5" />
                <span>Zero-Trust Security Triggered</span>
              </div>
              <p>
                Your single-window trading credentials were automatically wiped from memory to prevent unauthorized orders while unattended.
              </p>
              <p className="text-slate-400 text-[11px]">
                No one at this machine can execute trades. To resume popup-free trading, re-authorize with your connected wallet.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={onReenable1Click}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 font-mono font-bold text-xs uppercase text-white shadow-lg shadow-cyan-600/30 transition-all active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                <span>RE-ENABLE 1-CLICK TRADING</span>
              </button>

              <button
                onClick={onCloseSessionExpired}
                className="w-full py-2.5 rounded-xl bg-[#08021C] hover:bg-purple-950/50 border border-purple-500/30 text-purple-300 font-mono text-xs transition-all cursor-pointer"
              >
                CONTINUE WITH MANUAL CONFIRMATIONS
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
