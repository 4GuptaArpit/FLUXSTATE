"use client";

import React, { useMemo } from "react";
import { TrendingUp, TrendingDown, Zap } from "lucide-react";

export default function RealtimePulseChart({ priceHistory = [], currentPrice = 4.285, lockPrice = null }) {
  const points = useMemo(() => {
    if (!priceHistory || priceHistory.length < 2) return "";
    const min = Math.min(...priceHistory) * 0.998;
    const max = Math.max(...priceHistory) * 1.002;
    const range = max - min || 1;

    const width = 600;
    const height = 180;
    const padding = 15;

    const coords = priceHistory.map((val, idx) => {
      const x = padding + (idx / (priceHistory.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return coords.join(" ");
  }, [priceHistory]);

  const isUp = priceHistory.length >= 2 
    ? priceHistory[priceHistory.length - 1] >= priceHistory[priceHistory.length - 2]
    : true;

  const strokeColor = isUp ? "#10B981" : "#F43F5E";
  const glowColor = isUp ? "rgba(16, 185, 129, 0.4)" : "rgba(244, 63, 94, 0.4)";
  const gradientId = isUp ? "upGradient" : "downGradient";

  return (
    <div className="relative w-full h-56 bg-[#0B081F] rounded-2xl border border-[#241C48] p-4 flex flex-col justify-between overflow-hidden shadow-inner">
      {/* Background neon grid lines */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#7C3AED_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Header telemetry badge */}
      <div className="flex justify-between items-center z-10 text-xs font-mono">
        <div className="flex items-center space-x-2 bg-[#151036]/80 px-3 py-1 rounded-full border border-[#2C235A]">
          <span className={`w-2 h-2 rounded-full ${isUp ? "bg-emerald-400 animate-ping" : "bg-rose-400 animate-ping"}`} />
          <span className="text-gray-300">Monad Sub-Second Waveform (60 FPS)</span>
        </div>
        <div className="flex items-center space-x-3 text-gray-400">
          {lockPrice && (
            <span className="text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
              Lock: ${Number(lockPrice).toFixed(3)}
            </span>
          )}
          <span className="text-gray-400">Pyth Feed: <strong className="text-white">Active</strong></span>
        </div>
      </div>

      {/* SVG Canvas Curve */}
      <div className="relative flex-1 w-full flex items-center justify-center my-1">
        <svg viewBox="0 0 600 180" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="upGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="downGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={glowColor} />
            </filter>
          </defs>

          {/* Grid lines horizontal */}
          <line x1="15" y1="40" x2="585" y2="40" stroke="#1E1742" strokeDasharray="4 4" strokeWidth="1" />
          <line x1="15" y1="90" x2="585" y2="90" stroke="#1E1742" strokeDasharray="4 4" strokeWidth="1" />
          <line x1="15" y1="140" x2="585" y2="140" stroke="#1E1742" strokeDasharray="4 4" strokeWidth="1" />

          {/* Area Fill */}
          {points && (
            <polygon
              points={`15,180 ${points} 585,180`}
              fill={`url(#${gradientId})`}
              className="transition-all duration-300"
            />
          )}

          {/* Main Price Trendline */}
          {points && (
            <polyline
              fill="none"
              stroke={strokeColor}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              points={points}
              className="transition-all duration-200 ease-out"
            />
          )}

          {/* Live pulsing ping at latest point */}
          {points && (() => {
            const lastCoords = points.split(" ").slice(-1)[0].split(",");
            const cx = parseFloat(lastCoords[0]);
            const cy = parseFloat(lastCoords[1]);
            return (
              <g>
                <circle cx={cx} cy={cy} r="8" fill={strokeColor} opacity="0.3" className="animate-ping" />
                <circle cx={cx} cy={cy} r="4.5" fill="#FFFFFF" stroke={strokeColor} strokeWidth="2.5" />
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Ticker bottom bar */}
      <div className="flex justify-between items-center text-[11px] font-mono text-gray-500 pt-2 border-t border-[#1C163D] z-10">
        <span>T-15s</span>
        <span>T-10s</span>
        <span>T-5s</span>
        <span className="text-emerald-400 font-bold flex items-center">
          <Zap className="w-3 h-3 mr-1 text-emerald-400" /> Current: ${Number(currentPrice).toFixed(3)}
        </span>
      </div>
    </div>
  );
}
