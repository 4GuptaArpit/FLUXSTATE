"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Gauge, Cpu, ArrowUpRight, ArrowDownRight, RefreshCw, Zap } from "lucide-react";

export default function BlockFundingGauge({ 
  poolLong = 3420, 
  poolShort = 2180, 
  marketKey = "MON/USD" 
}) {
  const [blockCountdown, setBlockCountdown] = useState(0.8);

  // Sub-second 1s block countdown simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setBlockCountdown(prev => {
        if (prev <= 0.1) return 1.0;
        return Number((prev - 0.1).toFixed(1));
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Calculate skew & funding rate
  const { skewPercent, fundingRatePerBlock, fundingRateAnnualized, isLongHeavy, isShortHeavy } = useMemo(() => {
    const total = poolLong + poolShort || 1;
    const skew = (poolLong - poolShort) / total; // between -1 and 1
    const skewPct = skew * 100;
    
    // 0.05% base rate per block for 100% skew
    const ratePerBlock = skew * 0.025; 
    // Annualized (approx 31.5M blocks per year in Monad 1s blocks)
    const annualized = ratePerBlock * 365 * 24 * 60; // rough representation

    return {
      skewPercent: skewPct,
      fundingRatePerBlock: ratePerBlock,
      fundingRateAnnualized: annualized,
      isLongHeavy: skew > 0.02,
      isShortHeavy: skew < -0.02
    };
  }, [poolLong, poolShort]);

  // Semicircle gauge parameters
  // Angle: -70deg (max short) to +70deg (max long), 0deg is center
  const clampedSkew = Math.max(-100, Math.min(100, skewPercent));
  const needleAngle = (clampedSkew / 100) * 65; // -65deg to +65deg

  return (
    <div className="bg-[#050117]/90 border border-purple-500/25 rounded-2xl p-4 font-mono text-xs relative overflow-hidden shadow-xl">
      {/* Background glow orb */}
      <div 
        className={`absolute -right-8 -top-8 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-all duration-700 ${
          isLongHeavy ? "bg-emerald-500/15" : isShortHeavy ? "bg-rose-500/15" : "bg-purple-500/15"
        }`} 
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-purple-900/30">
        <div className="flex items-center space-x-2">
          <Gauge className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white tracking-wider uppercase text-[11px]">
            1S BLOCK FUNDING GAUGE
          </span>
        </div>
        <div className="flex items-center space-x-1.5 text-[10px] text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded-full border border-cyan-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>SYNC: {blockCountdown}s</span>
        </div>
      </div>

      {/* Circular Gauge Graphic */}
      <div className="mt-3 flex flex-col items-center justify-center relative">
        <svg width="220" height="110" viewBox="0 0 220 110" className="overflow-visible">
          <defs>
            <linearGradient id="gaugeTrackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Semicircle background rail */}
          <path
            d="M 25 100 A 85 85 0 0 1 195 100"
            fill="none"
            stroke="#1c0d3f"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Colored track */}
          <path
            d="M 25 100 A 85 85 0 0 1 195 100"
            fill="none"
            stroke="url(#gaugeTrackGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            filter="url(#gaugeGlow)"
            opacity="0.85"
          />

          {/* Center Tick Mark */}
          <line x1="110" y1="12" x2="110" y2="24" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="2 2" />

          {/* Dynamic Needle */}
          <g 
            transform={`rotate(${needleAngle}, 110, 100)`} 
            className="transition-transform duration-700 ease-out"
          >
            <line
              x1="110"
              y1="100"
              x2="110"
              y2="28"
              stroke="#ffffff"
              strokeWidth="3"
              strokeLinecap="round"
              filter="url(#gaugeGlow)"
            />
            <circle cx="110" cy="100" r="6" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
          </g>

          {/* Rail End Labels */}
          <text x="18" y="108" fill="#f43f5e" fontSize="9" fontWeight="bold" fontFamily="monospace">SHORT</text>
          <text x="100" y="108" fill="#94a3b8" fontSize="8" fontFamily="monospace">0%</text>
          <text x="175" y="108" fill="#10b981" fontSize="9" fontWeight="bold" fontFamily="monospace">LONG</text>
        </svg>

        {/* Digital Readout Center Badge */}
        <div className="mt-1 text-center">
          <div className="flex items-center justify-center space-x-1.5">
            <span className={`text-lg font-black tracking-tight ${
              isLongHeavy ? "text-emerald-400" : isShortHeavy ? "text-rose-400" : "text-purple-300"
            }`}>
              {fundingRatePerBlock >= 0 ? "+" : ""}{fundingRatePerBlock.toFixed(4)}%
            </span>
            <span className="text-[10px] text-slate-400 font-bold">/ 1s BLOCK</span>
          </div>

          {/* Status Direction Tag */}
          <div className="mt-1 inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-purple-500/30 bg-[#090220]">
            {isLongHeavy ? (
              <>
                <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-300">LONGS PAY SHORTS</span>
              </>
            ) : isShortHeavy ? (
              <>
                <ArrowDownRight className="w-3 h-3 text-rose-400" />
                <span className="text-rose-300">SHORTS PAY LONGS</span>
              </>
            ) : (
              <span className="text-purple-300">NEUTRAL POOL SKEW</span>
            )}
          </div>
        </div>
      </div>

      {/* Telemetry Footer Callout */}
      <div className="mt-3 pt-2.5 border-t border-purple-900/30 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center">
          <Cpu className="w-3 h-3 mr-1 text-cyan-400" />
          Skew: <strong className="text-white ml-1">{skewPercent >= 0 ? "+" : ""}{skewPercent.toFixed(1)}%</strong>
        </span>
        <span className="text-slate-500">
          Parallel Settlement: <strong className="text-cyan-300">Every 1.0s</strong>
        </span>
      </div>
    </div>
  );
}
