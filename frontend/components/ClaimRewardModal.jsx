"use client";

import React, { useState, useEffect } from "react";
import { Award, CheckCircle2, X, Sparkles, ArrowRight } from "lucide-react";

export default function ClaimRewardModal({ isOpen, onClose, round, onClaimSuccess }) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  // Reset state when modal re-opens for a new winning round
  useEffect(() => {
    if (isOpen) {
      setIsClaiming(false);
      setClaimed(false);
    }
  }, [isOpen, round?.id]);

  if (!isOpen || !round) return null;

  const handleClaim = () => {
    setIsClaiming(true);
    setTimeout(() => {
      setIsClaiming(false);
      setClaimed(true);
      if (onClaimSuccess) onClaimSuccess(round.id, round.payoutAmount);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#150F36] border border-purple-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Confetti ambient glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full bg-[#20184A] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mt-2">
          <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-purple-600/30">
            <Award className="w-9 h-9 text-white animate-bounce" />
          </div>

          <h3 className="text-2xl font-black font-display text-white mt-4 flex items-center justify-center space-x-2">
            <span>Prediction Won!</span>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h3>

          <p className="text-xs text-gray-400 font-mono mt-1">
            Round #{round.id} Settled Onchain • Monad 1-Sec Block
          </p>

          {/* Winning stats card */}
          <div className="bg-[#1C1447] border border-[#2E2368] rounded-2xl p-4 my-6 text-left space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Winning Direction:</span>
              <span className="text-emerald-400 font-bold">{round.winner}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Locked Price:</span>
              <span className="text-white">${round.lockPrice}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Closed Price:</span>
              <span className="text-white font-bold">${round.closePrice}</span>
            </div>
            <div className="pt-2 border-t border-[#2F2468] flex justify-between items-baseline">
              <span className="text-gray-300 font-semibold">Your Total Payout:</span>
              <span className="text-2xl font-black text-amber-400 font-display">
                +{round.payoutAmount || "18.5"} MON
              </span>
            </div>
          </div>

          {claimed ? (
            <div className="p-4 bg-emerald-950/50 border border-emerald-500/50 rounded-2xl flex items-center space-x-3 text-left">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <div className="text-sm font-bold text-white">Funds Dispatched to Wallet!</div>
                <div className="text-[11px] font-mono text-emerald-300">
                  Confirmed on Monad Testnet in 940ms
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-base shadow-xl shadow-purple-600/30 flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <span>{isClaiming ? "SETTLING ONCHAIN..." : "CLAIM REWARD ONCHAIN"}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
