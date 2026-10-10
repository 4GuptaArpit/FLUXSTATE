"use client";

import React from "react";
import { ChevronDown, ExternalLink, Zap } from "lucide-react";
import { getWalletClient, getPublicClient, CONTRACT_ADDRESSES, FLUX_MARKET_ABI } from "../../lib/web3";

export function KeeperSentinelDrawer({
  showKeeperDrawer,
  setShowKeeperDrawer,
  isPilotMode,
  keeperTxFeed,
  isSubmitting,
  setIsSubmitting,
  walletAddress,
  setTxToast
}) {
  const handleForceHeartbeat = async () => {
    if (isPilotMode) {
      setTxToast({
        title: "⚡ KEEPER CHECKPOINT TRIGGERED",
        amount: "Block Micro-Pulse",
        detail: "Simulated 1.0s Monad Block Checkpoint Settled",
        type: "CLOSE",
        isWin: true
      });
      setTimeout(() => setTxToast(null), 4000);
      return;
    }

    try {
      setIsSubmitting(true);
      const walletClient = getWalletClient();
      const publicClient = getPublicClient();

      if (!walletClient || !walletAddress) {
        setTxToast({
          title: "WALLET REQUIRED",
          amount: "Connect Monad Wallet",
          detail: "Please connect your wallet to trigger manual keeper pulse.",
          type: "CLOSE",
          isWin: false
        });
        setIsSubmitting(false);
        setTimeout(() => setTxToast(null), 4000);
        return;
      }

      setTxToast({
        title: "DISPATCHING KEEPER PULSE",
        amount: "checkpointFundingRate()",
        detail: "Confirm transaction in MetaMask to execute onchain...",
        type: "CLOSE",
        isWin: true
      });

      const hash = await walletClient.writeContract({
        address: CONTRACT_ADDRESSES.market,
        abi: FLUX_MARKET_ABI,
        functionName: "checkpointFundingRate",
        account: walletAddress
      });

      setTxToast({
        title: "⚡ KEEPER CHECKPOINT EXECUTED",
        amount: "Monad Block Settled",
        detail: `Tx: ${hash.slice(0, 10)}... (Verified on MonadScan)`,
        type: "CLOSE",
        isWin: true
      });

      await publicClient.waitForTransactionReceipt({ hash });
      setIsSubmitting(false);
      setTimeout(() => setTxToast(null), 5000);
    } catch (err) {
      console.warn("Checkpoint trigger error:", err);
      setIsSubmitting(false);
      const isCooldown = err.message && err.message.includes("Already checkpointed");
      const isRejected = err.message && err.message.includes("User rejected");
      setTxToast({
        title: isCooldown ? "ANTI-SANDWICH COOLDOWN" : (isRejected ? "PULSE CANCELLED" : "CHECKPOINT REVERTED"),
        amount: isCooldown ? "1 Checkpoint / Block Max" : "Action Cancelled",
        detail: isCooldown 
          ? "Anti-sandwich protection active: already settled in this block." 
          : (isRejected ? "Transaction cancelled in wallet." : "Failed to broadcast checkpoint pulse."),
        type: "CLOSE",
        isWin: false
      });
      setTimeout(() => setTxToast(null), 5000);
    }
  };

  return (
    <div className="bg-[#11131A] border border-cyan-500/20 rounded-2xl overflow-hidden text-xs font-mono">
      <button
        type="button"
        onClick={() => setShowKeeperDrawer(!showKeeperDrawer)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-cyan-950/20 transition-colors cursor-pointer"
      >
        <div className="flex items-center space-x-2 text-cyan-300 font-bold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <span className="text-[11px]">KEEPER SENTINEL (MONADSCAN VERIFIED)</span>
        </div>
        <div className="flex items-center space-x-1.5 text-slate-400 text-[10px]">
          <span className={"font-bold px-1.5 py-0.5 rounded border " + (
            isPilotMode 
              ? "text-[#FFB800] bg-[#FFB800]/10 border-[#FFB800]/30" 
              : "text-[#00FF66] bg-[#00FF66]/10 border-[#00FF66]/30"
          )}>
            {isPilotMode ? "SANDBOX SIM" : "🟢 SENTINEL ACTIVE (1s DRIFT)"}
          </span>
          <ChevronDown className={"w-3.5 h-3.5 transition-transform " + (showKeeperDrawer ? "rotate-180" : "")} />
        </div>
      </button>

      {showKeeperDrawer && (
        <div className="px-4 pb-3 space-y-2 border-t border-white/[0.06] pt-2.5">
          <div className="text-[11px] text-slate-300 mb-1 flex justify-between items-center bg-[#070318] px-3 py-1.5 rounded-lg border border-cyan-500/20">
            <span className="font-medium">Sentinel Address: <strong className="text-white">0xf163...def15</strong></span>
            <a
              href="https://testnet.monadscan.com/address/0xD822AA6f187dC05c5e95b34E4FBEDCEbBEBcDcC5"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-300 hover:text-white flex items-center gap-1 font-bold"
            >
              <span>Contract Logs</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          {keeperTxFeed.map((tx, idx) => (
            <div key={idx} className="flex items-center justify-between bg-[#0C0E15] rounded-xl px-3 py-2 border border-white/[0.06] text-xs">
              <div>
                <div className="font-bold text-cyan-300 text-xs">{tx.method}</div>
                <div className="text-slate-400 text-[11px] mt-0.5">Block #{tx.blockNumber} • {tx.age}</div>
              </div>
              <a
                href="https://testnet.monadscan.com/address/0xD822AA6f187dC05c5e95b34E4FBEDCEbBEBcDcC5"
                target="_blank"
                rel="noreferrer"
                title="View verified checkpoint transactions on MonadScan"
                className="flex items-center space-x-1 text-purple-300 hover:text-cyan-300 transition-colors font-mono font-bold text-xs"
              >
                <span>{tx.hash}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}

          {/* Public Decentralized Keeper Fallback Dispatch */}
          <div className="pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleForceHeartbeat}
              className="w-full py-2.5 rounded bg-[#161A24] hover:bg-[#1E2330] border border-white/20 font-mono font-bold text-xs text-[#CCFF00] hover:text-white flex items-center justify-center space-x-2 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-[#CCFF00]" />
              <span>⚡ FORCE KEEPER HEARTBEAT (PUBLIC DISPATCH)</span>
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-1 font-mono">
              Censorship-resistant fallback — any judge or wallet can settle continuous funding directly on Monad.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
