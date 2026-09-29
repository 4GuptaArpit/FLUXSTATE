"use client";

import React, { useState, useEffect } from "react";
import { Activity, Zap, TrendingUp, TrendingDown, Clock, ShieldCheck } from "lucide-react";

export default function LiveOrderTape({ activeMarketKey = "MON/USD", latestUserTrade = null }) {
  const [trades, setTrades] = useState([
    { id: "t-1", time: "19:42:04.120", market: "MON/USD", dir: "LONG", size: "25.0 MON", price: "$4.285", latency: 7.2, slot: "#S14" },
    { id: "t-2", time: "19:42:03.880", market: "ETH/USD", dir: "SHORT", size: "12.0 MON", price: "$3,452.80", latency: 8.1, slot: "#S42" },
    { id: "t-3", time: "19:42:03.450", market: "BTC/USD", dir: "LONG", size: "100.0 MON", price: "$88,420.50", latency: 6.9, slot: "#S08" },
    { id: "t-4", time: "19:42:02.910", market: "MON/USD", dir: "SHORT", size: "5.0 MON", price: "$4.284", latency: 7.6, slot: "#S31" },
    { id: "t-5", time: "19:42:02.140", market: "MON/USD", dir: "LONG", size: "50.0 MON", price: "$4.286", latency: 7.4, slot: "#S55" },
  ]);

  // Prepend user trade whenever user executes an order
  useEffect(() => {
    if (latestUserTrade) {
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0] + "." + String(now.getMilliseconds()).padStart(3, "0");
      const newTrade = {
        id: "user-" + Date.now(),
        time: timeStr,
        market: latestUserTrade.market || activeMarketKey,
        dir: latestUserTrade.dir || "LONG",
        size: latestUserTrade.amount + " MON",
        price: latestUserTrade.price || "$4.285",
        latency: +(6.5 + Math.random() * 2.0).toFixed(1),
        slot: "#S" + Math.floor(Math.random() * 64),
        isUser: true
      };
      setTrades(prev => [newTrade, ...prev.slice(0, 14)]);
    }
  }, [latestUserTrade, activeMarketKey]);

  // Ambient stream of parallel filled orders
  useEffect(() => {
    const addresses = ["0x7A1F", "0x9C4B", "0x2E8D", "0x5B31", "0x8F90", "0x3D14"];
    const markets = ["MON/USD", "ETH/USD", "BTC/USD"];

    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0] + "." + String(now.getMilliseconds()).padStart(3, "0");
      const dir = Math.random() > 0.49 ? "LONG" : "SHORT";
      const market = markets[Math.floor(Math.random() * markets.length)];
      const size = (Math.random() * 40 + 2).toFixed(1) + " MON";
      const price = market === "MON/USD" ? "$4.285" : (market === "ETH/USD" ? "$3,452.80" : "$88,420.50");

      const trade = {
        id: "t-" + Date.now(),
        time: timeStr,
        market,
        dir,
        size,
        price,
        latency: +(6.4 + Math.random() * 2.8).toFixed(1),
        slot: "#S" + Math.floor(Math.random() * 64)
      };

      setTrades(prev => [trade, ...prev.slice(0, 14)]);
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#08021c]/90 border border-purple-900/30 rounded-2xl p-4 font-mono text-xs">
      <div className="flex items-center justify-between pb-2.5 border-b border-purple-900/30">
        <div className="flex items-center space-x-2">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="font-bold text-white text-[11px] uppercase tracking-wider">
            SUB-SECOND PARALLEL TRADE TAPE
          </span>
        </div>
        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 font-bold">
          <Zap className="w-3 h-3" />
          AVG 7.3ms SLOTS
        </span>
      </div>

      <div className="mt-2.5 space-y-1.5 max-h-48 overflow-y-auto pr-1">
        {trades.map(trade => (
          <div 
            key={trade.id} 
            className={"flex items-center justify-between py-1.5 px-2.5 rounded-lg border transition-all text-[11px] " + (
              trade.isUser 
                ? "bg-purple-950/60 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)] animate-pulse" 
                : "bg-[#0b0526]/60 border-purple-900/20 hover:border-purple-700/40"
            )}
          >
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 text-[10px]">{trade.time}</span>
              <span className="text-purple-300 font-bold">{trade.market}</span>
              <span className={"px-1.5 py-0.5 rounded text-[9px] font-black " + (
                trade.dir === "LONG" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
              )}>
                {trade.dir}
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-white font-bold">{trade.size}</span>
              <span className="text-slate-400">{trade.price}</span>
              <span className="text-cyan-300 text-[10px] font-bold bg-cyan-950/50 px-1.5 py-0.5 rounded">
                {trade.slot} • {trade.latency}ms
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
