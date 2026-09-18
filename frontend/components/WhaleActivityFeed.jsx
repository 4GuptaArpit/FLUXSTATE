"use client";

import React, { useState, useEffect } from "react";
import { Zap, TrendingUp, TrendingDown } from "lucide-react";

export default function WhaleActivityFeed() {
  const [activities, setActivities] = useState([
    { id: 1, wallet: "0x7F2B...4a9B", dir: "UP", amount: "25 MON", time: "120ms ago", status: "Confirmed" },
    { id: 2, wallet: "0x3C1A...98eF", dir: "DOWN", amount: "50 MON", time: "430ms ago", status: "Confirmed" },
    { id: 3, wallet: "0xB29F...712a", dir: "UP", amount: "100 MON", time: "980ms ago", status: "Confirmed" },
    { id: 4, wallet: "0x5E84...10dC", dir: "UP", amount: "15 MON", time: "1.4s ago", status: "Confirmed" },
    { id: 5, wallet: "0x91DC...384b", dir: "DOWN", amount: "40 MON", time: "1.9s ago", status: "Confirmed" },
  ]);

  useEffect(() => {
    const wallets = ["0x88AA", "0x22DC", "0xEE09", "0x77FF", "0x33B1", "0x55AA", "0xCC90"];
    const dirs = ["UP", "DOWN"];
    const amounts = ["10 MON", "25 MON", "50 MON", "120 MON", "250 MON", "5 MON", "75 MON"];

    const interval = setInterval(() => {
      const newActivity = {
        id: Date.now(),
        wallet: `${wallets[Math.floor(Math.random() * wallets.length)]}...${Math.floor(1000 + Math.random() * 9000).toString(16)}`,
        dir: dirs[Math.floor(Math.random() * dirs.length)],
        amount: amounts[Math.floor(Math.random() * amounts.length)],
        time: `${Math.floor(100 + Math.random() * 400)}ms ago`,
        status: "Confirmed"
      };

      setActivities(prev => [newActivity, ...prev.slice(0, 5)]);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full overflow-hidden bg-[#0C0822] border-y border-[#1F1740] py-2">
      <div className="flex items-center space-x-6 text-xs font-mono animate-marquee whitespace-nowrap">
        {activities.concat(activities).map((item, idx) => (
          <div key={idx} className="flex items-center space-x-2 bg-[#140F30] px-3 py-1 rounded-full border border-[#261E48]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-gray-400">{item.wallet}</span>
            <span className={`font-bold flex items-center ${item.dir === "UP" ? "text-emerald-400" : "text-rose-400"}`}>
              {item.dir === "UP" ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
              {item.amount}
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-purple-300 font-semibold">{item.time}</span>
            <span className="text-emerald-400 bg-emerald-950/60 text-[10px] px-1.5 py-0.2 rounded border border-emerald-800">
              1.0s Monad Finality
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
