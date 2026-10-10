"use client";

import React from "react";
import { 
  Terminal, 
  XCircle, 
  Activity, 
  Sliders, 
  Wallet, 
  Gauge, 
  RefreshCw, 
  Zap, 
  Lock, 
  CheckCircle2, 
  Cpu, 
  ShieldCheck, 
  ExternalLink 
} from "lucide-react";

export function GuideModal({
  show,
  onClose,
  isPilotMode,
  setIsPilotMode
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-[10000]">
      <div className="bg-[#0A0D14] border border-[#00E5FF]/30 rounded-xl p-5 sm:p-7 max-w-2xl w-full shadow-[0_25px_70px_rgba(0,229,255,0.08)] space-y-5 relative max-h-[88vh] overflow-y-auto font-mono">
        {/* Header with Blueprint Cyan Signal Keyline */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg border border-[#00E5FF]/40 bg-[#00E5FF]/10 flex items-center justify-center shadow-inner">
              <Terminal className="w-4 h-4 text-[#00E5FF]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-[#00E5FF] font-bold tracking-widest uppercase">PROTOCOL SPECIFICATION DOSSIER</span>
                <span className="text-[10px] text-zinc-500">• MONAD L1</span>
              </div>
              <h3 className="font-bold text-sm text-zinc-100 tracking-wide">SYSTEM ARCHITECTURE & BENCHMARKS</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-white/10 hover:border-rose-500/50 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Close Spec Modal [Esc]"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switch Tabs inside Guide (Blueprint Engineering Toggle) */}
        <div className="flex bg-[#06080E] p-1 rounded-lg border border-white/10 font-mono text-[11px]">
          <button
            type="button"
            onClick={() => setIsPilotMode(true)}
            className={"flex-1 py-1.5 rounded font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer " + (
              isPilotMode 
                ? "bg-amber-950/60 text-amber-300 border border-amber-500/40 shadow-sm" 
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <span>PILOT SANDBOX BENCHMARKS</span>
          </button>
          <button
            type="button"
            onClick={() => setIsPilotMode(false)}
            className={"flex-1 py-1.5 rounded font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer " + (
              !isPilotMode 
                ? "bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/40 shadow-sm" 
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <span>LIVE TESTNET PROTOCOL</span>
          </button>
        </div>

        {/* Feature Cards Grid (Mode-Sensitive) */}
        <div className="space-y-3 font-mono text-xs">
          {/* Protocol Spec 00: Live Telemetry Ribbon */}
          <div className="bg-[#08090C] p-3.5 rounded border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[#CCFF00] font-bold text-[11px]">
                <Activity className="w-3.5 h-3.5 text-[#CCFF00]" />
                <span>Live Protocol Telemetry Ribbon</span>
              </div>
              <span className="text-[10px] text-zinc-500">1.0s MONAD CADENCE</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Direct hardware-level telemetry synced with Monad Testnet block height. Displays continuous 1.0s epoch ticks, &lt;380ms Pyth Hermes sub-second oracle latency, 10,000 TPS peak network capacity, and live simulated gas consumption ($0.000042/tx).
            </p>
          </div>

          {isPilotMode ? (
            <>
              {/* Sandbox Feature 1: Volatility & Liquidation Stress Tester */}
              <div className="bg-[#08090C] p-3.5 rounded border border-amber-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-amber-300 font-bold text-[11px]">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Volatility & Liquidation Stress Engine</span>
                  </div>
                  <span className="text-[9px] bg-amber-950/60 text-amber-400 px-1.5 py-0.5 rounded border border-amber-500/30">JUDGE TOOLKIT</span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Interactive risk simulation engine: Open any position and click <strong className="text-amber-300">STRESS TEST MMR</strong>. Shift Pyth oracle prices ±40% dynamically, watch the Margin Health Bar turn green to red, and trigger simulated keeper liquidations to observe bad-debt insolvency barriers.
                </p>
                <div className="text-[10px] text-amber-400/90 bg-amber-950/30 px-2 py-1 rounded border border-amber-500/20">
                  ✓ Instant Sandbox Demo: Zero real MON at risk; test liquidation edge-cases on demand.
                </div>
              </div>

              {/* Sandbox Feature 2: 1,000 MON Pilot Wallet */}
              <div className="bg-[#08090C] p-3.5 rounded border border-white/10 space-y-1.5">
                <div className="flex items-center space-x-2 text-zinc-300 font-bold text-[11px]">
                  <Wallet className="w-3.5 h-3.5 text-zinc-400" />
                  <span>1,000 MON Virtual Sandbox Margin</span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  No MetaMask or testnet faucet needed. Enjoy instant trading with 1,000 virtual MON margin, persistent browser localStorage accounting, and full isolated margin leverage up to 50x.
                </p>
              </div>

              {/* Sandbox Feature 3: EVM Feasibility Matrix */}
              <div className="bg-[#08090C] p-3.5 rounded border border-white/10 space-y-1.5">
                <div className="flex items-center space-x-2 text-cyan-300 font-bold text-[11px]">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  <span>EVM Architectural Cost & Feasibility Matrix</span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Comparative gas economics: Ethereum L1 costs $14,400/day for 86,400 per-block keeper updates; Arbitrum costs $480/day. Monad parallel execution costs &lt;$0.05/day, enabling true onchain block-by-block funding.
                </p>
              </div>

              {/* Sandbox Feature 4: 1-Click Balance Refill & % Sizing Pills */}
              <div className="bg-[#08090C] p-3.5 rounded border border-white/10 space-y-1.5">
                <div className="flex items-center space-x-2 text-emerald-300 font-bold text-[11px]">
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instant Refill & Preset Sizing Matrix</span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Depleted your margin during stress testing? Click <strong className="text-emerald-300">REFILL</strong> in the balance pill to instantly restore 1,000 MON. Use 25% / 50% / 75% / MAX buttons for instant order sizing.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Testnet Feature 1: 1-Click Session Keys */}
              <div className="bg-[#08090C] p-3.5 rounded border border-[#CCFF00]/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[#CCFF00] font-bold text-[11px]">
                    <Zap className="w-3.5 h-3.5 text-[#CCFF00]" />
                    <span>1-Click Trading (EIP-712 Session Keys)</span>
                  </div>
                  <span className="text-[9px] bg-[#CCFF00]/10 text-[#CCFF00] px-1.5 py-0.5 rounded border border-[#CCFF00]/30">0 POPUPS</span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Tired of confirming every market order in MetaMask? Click <strong className="text-[#CCFF00]">ENABLE 1-CLICK</strong> in the Perp Cockpit. Sign once with your wallet to grant an ephemeral in-memory session key. Execute trades in sub-50ms with zero popups!
                </p>
                <div className="text-[10px] text-emerald-400/90 bg-emerald-950/30 px-2 py-1 rounded border border-emerald-500/20">
                  ✓ Non-Custodial: Session keys cannot transfer or withdraw funds.
                </div>
              </div>

              {/* Testnet Feature 2: 24-Hour Quick-PIN Protection */}
              <div className="bg-[#08090C] p-3.5 rounded border border-white/10 space-y-1.5">
                <div className="flex items-center space-x-2 text-zinc-300 font-bold text-[11px]">
                  <Lock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>24-Hour Quick-PIN Persistence & Auto-Lock</span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Choose <strong className="text-zinc-200">Remember for 24 Hours</strong> and set a 4-digit PIN. Your session survives browser reloads. If you walk away for 15 minutes, the terminal auto-locks to protect your keys until you re-enter your PIN.
                </p>
              </div>

              {/* Testnet Feature 3: Onchain Position Recovery */}
              <div className="bg-[#08090C] p-3.5 rounded border border-white/10 space-y-1.5">
                <div className="flex items-center space-x-2 text-emerald-300 font-bold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>On-Chain Position State Hydration</span>
                </div>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  All live trades are written to Monad Testnet contracts (<code className="text-zinc-300">FluxMarket.sol</code>). On browser reload, your active position is automatically recovered directly from contract storage.
                </p>
              </div>
            </>
          )}

          {/* Shared Feature: Smart Bracket Order (TP/SL) */}
          <div className="bg-[#08090C] p-3.5 rounded border border-white/10 space-y-1.5">
            <div className="flex items-center space-x-2 text-zinc-200 font-bold text-[11px]">
              <Sliders className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>Smart Bracket Orders (TP / SL)</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Institutional risk management: set Take Profit (TP) and Stop Loss (SL) triggers with real-time risk/reward ratio calculation and visual target badges directly in the Order Cockpit.
            </p>
          </div>

          {/* Shared Foundation Feature: High-Frequency Hotkeys */}
          <div className="bg-[#08090C] p-3.5 rounded border border-white/10 space-y-1.5">
            <div className="flex items-center space-x-2 text-amber-300 font-bold text-[11px]">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>High-Frequency Hotkey Execution</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Zero-latency keyboard shortcuts for scalping: Press <strong className="text-emerald-400">B</strong> to Buy / Long, <strong className="text-rose-400">S</strong> to Sell / Short, <strong className="text-amber-400">C</strong> to Close & Settle, and <strong className="text-[#CCFF00]">1</strong> to toggle 1-Click Trading.
            </p>
          </div>

          {/* Shared Foundation Feature: 16-Shard Parallel EVM & Live Matrix */}
          <div className="bg-[#08090C] p-3.5 rounded border border-[#00E5FF]/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[#00E5FF] font-bold text-[11px]">
                <Cpu className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>16-Shard Block-STM Parallel Storage Matrix</span>
              </div>
              <span className="text-[9px] bg-[#00E5FF]/10 text-[#00E5FF] px-1.5 py-0.5 rounded border border-[#00E5FF]/30 font-bold">15.4× THROUGHPUT</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              FluxState splits open interest and balances across 16 independent EVM storage slots (<code className="text-zinc-300">keccak256(shardId, 0x05)</code>). The matrix automatically highlights your assigned storage slot, delivers a measured <strong className="text-[#00E5FF]">15.4× throughput multiplier</strong> over serial DEXes, eliminates global state lockups, and features a one-click 500-Trade Parallel Benchmark.
            </p>
          </div>

          {/* Shared Foundation Feature: Block Stream Funding Taximeter */}
          <div className="bg-[#08090C] p-3.5 rounded border border-white/10 space-y-1.5">
            <div className="flex items-center space-x-2 text-cyan-300 font-bold text-[11px]">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>Continuous Block-by-Block Funding Accumulator</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              Every 1.0s Monad block checkpoint, funding dynamically accrues and settles via an O(1) lazy index. The Active Position HUD features a live funding stream breakdown with the <strong className="text-cyan-300">1-SEC FUNDING APPLIED</strong> badge and real-time micro-funding accrual counter.
            </p>
          </div>

          {/* Verified On-Chain Deployments Table */}
          <div className="bg-[#08090C] p-3.5 rounded border border-[#836EF9]/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-[#836EF9] font-bold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#836EF9]" />
                <span>Verified Smart Contracts • Monad Testnet (10143)</span>
              </div>
              <span className="text-[9px] bg-[#836EF9]/15 text-[#836EF9] px-1.5 py-0.5 rounded border border-[#836EF9]/30 font-bold">MONADSCAN VERIFIED</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] pt-1">
              <a 
                href="https://testnet.monadscan.com/address/0xD822AA6f187dC05c5e95b34E4FBEDCEbBEBcDcC5" 
                target="_blank" 
                rel="noreferrer"
                className="p-2 rounded bg-white/[0.02] border border-white/10 hover:border-[#836EF9]/60 hover:bg-[#836EF9]/10 transition-colors flex justify-between items-center group"
              >
                <div>
                  <div className="text-zinc-300 font-bold">FluxMarket (16 Shards)</div>
                  <div className="text-zinc-500 font-mono text-[9px]">0xD822...DcC5</div>
                </div>
                <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-[#836EF9]" />
              </a>
              <a 
                href="https://testnet.monadscan.com/address/0x5047f8d761dcE6edf7b2171b123e0A758056d914" 
                target="_blank" 
                rel="noreferrer"
                className="p-2 rounded bg-white/[0.02] border border-white/10 hover:border-[#836EF9]/60 hover:bg-[#836EF9]/10 transition-colors flex justify-between items-center group"
              >
                <div>
                  <div className="text-zinc-300 font-bold">FluxVault (LP & Insurance)</div>
                  <div className="text-zinc-500 font-mono text-[9px]">0x5047...d914</div>
                </div>
                <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-[#836EF9]" />
              </a>
              <a 
                href="https://testnet.monadscan.com/address/0xBF76d0d245fED0C1279c6719cBe27635805533B2" 
                target="_blank" 
                rel="noreferrer"
                className="p-2 rounded bg-white/[0.02] border border-white/10 hover:border-[#836EF9]/60 hover:bg-[#836EF9]/10 transition-colors flex justify-between items-center group"
              >
                <div>
                  <div className="text-zinc-300 font-bold">FluxFundingEngine</div>
                  <div className="text-zinc-500 font-mono text-[9px]">0xBF76...33B2</div>
                </div>
                <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-[#836EF9]" />
              </a>
              <a 
                href="https://testnet.monadscan.com/address/0xc547C6f06495690cEd525EDd8Eaf4C17484b0C39" 
                target="_blank" 
                rel="noreferrer"
                className="p-2 rounded bg-white/[0.02] border border-white/10 hover:border-[#836EF9]/60 hover:bg-[#836EF9]/10 transition-colors flex justify-between items-center group"
              >
                <div>
                  <div className="text-zinc-300 font-bold">Pyth Oracle Hermes</div>
                  <div className="text-zinc-500 font-mono text-[9px]">0xc547...0C39</div>
                </div>
                <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-[#836EF9]" />
              </a>
            </div>
          </div>

        </div>

        {/* Close Button */}
        <div className="pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-lg border border-[#00E5FF]/40 bg-[#00E5FF] hover:bg-[#00cbe5] text-black font-mono font-black text-xs uppercase tracking-wider transition-all active:scale-[0.98] shadow-lg shadow-[#00E5FF]/20 cursor-pointer"
          >
            ACKNOWLEDGE & RETURN TO TERMINAL
          </button>
        </div>
      </div>
    </div>
  );
}
