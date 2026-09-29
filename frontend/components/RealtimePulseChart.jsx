"use client";

import React, { useState, useMemo, useRef } from "react";
import { TrendingUp, TrendingDown, Zap, BarChart2, Activity, Eye, ShieldCheck, Crosshair } from "lucide-react";
import { cyberAudio } from "../lib/audio";

export default function RealtimePulseChart({ 
  priceHistory = [], 
  currentPrice = 4.285, 
  lockPrice = null,
  marketKey = "MON/USD",
  activeEpoch = 1042
}) {
  const [chartMode, setChartMode] = useState("waveform"); // "waveform" | "candles"
  const [resolution, setResolution] = useState("1s"); // "1s" | "5s" | "15s"
  const [hoverData, setHoverData] = useState(null);
  const svgRef = useRef(null);

  const decimals = marketKey.includes("BTC") ? 1 : (marketKey.includes("ETH") ? 2 : 3);

  // Compute boundaries
  const { minPrice, maxPrice, range, highFormatted, lowFormatted } = useMemo(() => {
    if (!priceHistory || priceHistory.length < 2) {
      return { 
        minPrice: currentPrice * 0.998, 
        maxPrice: currentPrice * 1.002, 
        range: currentPrice * 0.004,
        highFormatted: (currentPrice * 1.002).toFixed(decimals),
        lowFormatted: (currentPrice * 0.998).toFixed(decimals)
      };
    }
    const min = Math.min(...priceHistory);
    const max = Math.max(...priceHistory);
    const spread = (max - min) || (currentPrice * 0.004);
    const paddedMin = min - spread * 0.12;
    const paddedMax = max + spread * 0.12;

    return {
      minPrice: paddedMin,
      maxPrice: paddedMax,
      range: paddedMax - paddedMin,
      highFormatted: max.toFixed(decimals),
      lowFormatted: min.toFixed(decimals)
    };
  }, [priceHistory, currentPrice, decimals]);

  const width = 720;
  const height = 200;
  const paddingX = 24;
  const paddingY = 20;

  // Waveform Points Calculation
  const { pointsStr, lastX, lastY } = useMemo(() => {
    if (!priceHistory || priceHistory.length < 2) return { pointsStr: "", lastX: 0, lastY: 0 };

    const coords = priceHistory.map((val, idx) => {
      const x = paddingX + (idx / (priceHistory.length - 1)) * (width - paddingX * 2);
      const y = height - paddingY - ((val - minPrice) / range) * (height - paddingY * 2);
      return { x, y, val };
    });

    const pointsStr = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
    const last = coords[coords.length - 1];

    return { pointsStr, lastX: last.x, lastY: last.y };
  }, [priceHistory, minPrice, range, width, height]);

  // Procedural Micro-Candles from Price History
  const candles = useMemo(() => {
    if (!priceHistory || priceHistory.length < 4) return [];

    const numCandles = Math.min(20, Math.floor(priceHistory.length));
    const step = (priceHistory.length - 1) / (numCandles - 1 || 1);
    const candleWidth = (width - paddingX * 2) / numCandles * 0.65;

    return Array.from({ length: numCandles }, (_, i) => {
      const idx = Math.min(priceHistory.length - 1, Math.round(i * step));
      const close = priceHistory[idx];
      const prevIdx = Math.max(0, idx - 1);
      const open = priceHistory[prevIdx];
      
      const wickSpread = (Math.abs(close - open) * 0.35) || (close * 0.0003);
      const high = Math.max(open, close) + wickSpread;
      const low = Math.min(open, close) - wickSpread;

      const x = paddingX + (i / (numCandles - 1 || 1)) * (width - paddingX * 2);
      const openY = height - paddingY - ((open - minPrice) / range) * (height - paddingY * 2);
      const closeY = height - paddingY - ((close - minPrice) / range) * (height - paddingY * 2);
      const highY = height - paddingY - ((high - minPrice) / range) * (height - paddingY * 2);
      const lowY = height - paddingY - ((low - minPrice) / range) * (height - paddingY * 2);

      const isBullish = close >= open;

      return {
        id: i,
        x,
        openY,
        closeY,
        highY,
        lowY,
        width: candleWidth,
        isBullish,
        open,
        close,
        high,
        low
      };
    });
  }, [priceHistory, minPrice, range, width, height]);

  const isUp = priceHistory.length >= 2 
    ? priceHistory[priceHistory.length - 1] >= priceHistory[priceHistory.length - 2]
    : true;

  const strokeColor = isUp ? "#10B981" : "#F43F5E";
  const glowColor = isUp ? "rgba(16, 185, 129, 0.45)" : "rgba(244, 63, 94, 0.45)";
  const gradientId = isUp ? "neonUpGrad" : "neonDownGrad";

  // Mouse Move Crosshair Handler
  const handleMouseMove = (e) => {
    if (!svgRef.current || !priceHistory || priceHistory.length < 2) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = Math.max(paddingX, Math.min(width - paddingX, ((e.clientX - rect.left) / rect.width) * width));
    
    // Normalized data index
    const normX = (mouseX - paddingX) / (width - paddingX * 2);
    const dataIdx = Math.min(priceHistory.length - 1, Math.max(0, Math.round(normX * (priceHistory.length - 1))));
    const priceVal = priceHistory[dataIdx];
    const mouseY = height - paddingY - ((priceVal - minPrice) / range) * (height - paddingY * 2);

    const firstPrice = priceHistory[0] || priceVal;
    const delta = (((priceVal - firstPrice) / firstPrice) * 100).toFixed(2);

    setHoverData({
      x: mouseX,
      y: mouseY,
      price: priceVal,
      delta: (delta >= 0 ? "+" : "") + delta + "%",
      isPositive: delta >= 0,
      index: dataIdx
    });
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  // Lock price Y position
  const lockY = lockPrice 
    ? height - paddingY - ((Number(lockPrice) - minPrice) / range) * (height - paddingY * 2)
    : null;

  return (
    <div className="relative w-full bg-[#08031d]/95 rounded-3xl border border-purple-900/40 p-5 flex flex-col justify-between overflow-hidden shadow-2xl backdrop-blur-2xl">
      {/* Background Matrix Pattern */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[radial-gradient(#8B5CF6_1px,transparent_1px)] [background-size:18px_18px]" />

      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-900/30 z-20 text-xs font-mono">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-[#0e0730] px-3 py-1 rounded-xl border border-purple-900/50">
            <span className={`w-2 h-2 rounded-full ${isUp ? "bg-emerald-400 animate-ping" : "bg-rose-400 animate-ping"}`} />
            <span className="text-white font-bold tracking-tight">PYTH SUB-SECOND 60 FPS</span>
          </div>

          {/* Timeframe selector */}
          <div className="hidden sm:flex items-center bg-[#0e0730] p-0.5 rounded-lg border border-purple-900/50 text-[10px]">
            {["1s", "5s", "15s"].map(res => (
              <button
                key={res}
                onClick={() => { cyberAudio.playTick(); setResolution(res); }}
                className={`px-2 py-0.5 rounded transition-all ${resolution === res ? "bg-purple-600 text-white font-bold" : "text-slate-400 hover:text-white"}`}
              >
                {res}
              </button>
            ))}
          </div>
        </div>

        {/* View Switcher: Waveform vs Candlesticks */}
        <div className="flex items-center space-x-2">
          <div className="flex bg-[#0e0730] p-1 rounded-xl border border-purple-900/50">
            <button
              onClick={() => { cyberAudio.playTick(); setChartMode("waveform"); }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center space-x-1.5 transition-all ${
                chartMode === "waveform" ? "bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>Waveform</span>
            </button>
            <button
              onClick={() => { cyberAudio.playTick(); setChartMode("candles"); }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono flex items-center space-x-1.5 transition-all ${
                chartMode === "candles" ? "bg-purple-950 text-purple-300 font-bold border border-purple-500/40 shadow-sm" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Candles</span>
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas with Crosshair Tracking */}
      <div 
        className="relative flex-1 w-full my-2 cursor-crosshair select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <svg 
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-52 overflow-visible"
        >
          <defs>
            <linearGradient id="neonUpGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#06B6D4" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#030014" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="neonDownGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#8B5CF6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#030014" stopOpacity="0.0" />
            </linearGradient>
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={glowColor} />
            </filter>
          </defs>

          {/* Grid lines horizontal */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#1b113d" strokeDasharray="3 4" strokeWidth="1" />
          <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="#1b113d" strokeDasharray="3 4" strokeWidth="1" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#1b113d" strokeDasharray="3 4" strokeWidth="1" />

          {/* Dynamic Range Bounds (High & Low labels) */}
          <g className="text-[10px] font-mono fill-slate-500">
            <text x={paddingX + 2} y={paddingY - 5}>▲ HIGH: ${highFormatted}</text>
            <text x={paddingX + 2} y={height - paddingY + 14}>▼ LOW: ${lowFormatted}</text>
          </g>

          {/* Lock Price Benchmark Line (if round is active) */}
          {lockY && (
            <g>
              <line 
                x1={paddingX} 
                y1={lockY} 
                x2={width - paddingX} 
                y2={lockY} 
                stroke="#A78BFA" 
                strokeDasharray="4 4" 
                strokeWidth="1.2" 
                opacity="0.75"
              />
              <text x={width - paddingX - 95} y={lockY - 4} fill="#C4B5FD" className="text-[9px] font-mono">
                LOCK: ${Number(lockPrice).toFixed(decimals)}
              </text>
            </g>
          )}

          {/* MODE 1: QUANTUM WAVEFORM */}
          {chartMode === "waveform" && pointsStr && (
            <>
              {/* Gradient Area */}
              <polygon
                points={`${paddingX},${height - paddingY} ${pointsStr} ${width - paddingX},${height - paddingY}`}
                fill={`url(#${gradientId})`}
                className="transition-all duration-300"
              />

              {/* Glowing Spline */}
              <polyline
                fill="none"
                stroke={strokeColor}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#neonGlow)"
                points={pointsStr}
                className="transition-all duration-200 ease-out"
              />

              {/* Leading Pulse Wavehead */}
              <g>
                <circle cx={lastX} cy={lastY} r="10" fill={strokeColor} opacity="0.3" className="animate-ping" />
                <circle cx={lastX} cy={lastY} r="6" fill="#FFFFFF" stroke={strokeColor} strokeWidth="2.5" />
              </g>
            </>
          )}

          {/* MODE 2: CYBER CANDLESTICKS */}
          {chartMode === "candles" && candles.map(c => {
            const topY = Math.min(c.openY, c.closeY);
            const bodyHeight = Math.max(3, Math.abs(c.closeY - c.openY));
            const col = c.isBullish ? "#10B981" : "#F43F5E";

            return (
              <g key={c.id} className="transition-all duration-200">
                {/* Upper/Lower Wick */}
                <line x1={c.x} y1={c.highY} x2={c.x} y2={c.lowY} stroke={col} strokeWidth="1.5" opacity="0.8" />
                {/* Candle Body */}
                <rect 
                  x={c.x - c.width / 2} 
                  y={topY} 
                  width={c.width} 
                  height={bodyHeight} 
                  fill={c.isBullish ? "rgba(16, 185, 129, 0.4)" : "rgba(244, 63, 94, 0.4)"}
                  stroke={col}
                  strokeWidth="1.5"
                  rx="1.5"
                />
              </g>
            );
          })}

          {/* INTERACTIVE HOVER CROSSHAIR */}
          {hoverData && (
            <g className="transition-opacity duration-75">
              {/* Vertical Crosshair Line */}
              <line 
                x1={hoverData.x} 
                y1={0} 
                x2={hoverData.x} 
                y2={height} 
                stroke="#06B6D4" 
                strokeDasharray="2 3" 
                strokeWidth="1.2" 
                opacity="0.85" 
              />
              {/* Horizontal Price Line */}
              <line 
                x1={paddingX} 
                y1={hoverData.y} 
                x2={width - paddingX} 
                y2={hoverData.y} 
                stroke="#06B6D4" 
                strokeDasharray="2 3" 
                strokeWidth="1.2" 
                opacity="0.85" 
              />
              {/* Intersection Pulse */}
              <circle cx={hoverData.x} cy={hoverData.y} r="5" fill="#06B6D4" stroke="#FFFFFF" strokeWidth="2" />
            </g>
          )}
        </svg>

        {/* Floating Cyber Hover Tooltip */}
        {hoverData && (
          <div 
            style={{ 
              left: Math.min(width - 180, Math.max(20, hoverData.x - 70)) + "px",
              top: Math.max(10, hoverData.y - 65) + "px"
            }}
            className="absolute pointer-events-none z-30 bg-[#07011c]/95 border border-cyan-400 p-2.5 rounded-xl font-mono text-[11px] shadow-2xl shadow-cyan-500/20 animate-in fade-in"
          >
            <div className="flex items-center justify-between space-x-3">
              <span className="text-white font-black">${Number(hoverData.price).toFixed(decimals)}</span>
              <span className={`font-bold ${hoverData.isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                {hoverData.delta}
              </span>
            </div>
            <div className="text-[9px] text-cyan-300/80 mt-0.5 flex items-center justify-between gap-2">
              <span>Slot #S{hoverData.index % 64}</span>
              <span>7.4ms Latency</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Telemetry Ticker */}
      <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 pt-3 border-t border-purple-900/30 z-10">
        <div className="flex items-center space-x-3">
          <span className="text-slate-500">T-15s</span>
          <span className="text-slate-500">T-10s</span>
          <span className="text-slate-500">T-5s</span>
          <span className="text-purple-300 font-bold bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/30">
            NOW (LIVE)
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-slate-400 hidden sm:inline">
            Active Epoch: <strong className="text-white">#{activeEpoch}</strong>
          </span>
          <span className="text-emerald-400 font-black flex items-center bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-500/30 shadow-sm">
            <Zap className="w-3.5 h-3.5 mr-1 text-emerald-400 animate-pulse" /> 
            ${Number(currentPrice).toFixed(decimals)}
          </span>
        </div>
      </div>
    </div>
  );
}
