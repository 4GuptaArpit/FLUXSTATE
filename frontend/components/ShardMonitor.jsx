import React, { useEffect, useState } from "react";

export const ShardMonitor = () => {
  const [shards, setShards] = useState(() =>
    Array.from({ length: 16 }, (_, i) => ({
      shardId: i,
      longOI: 18000 + (i * 2400),
      shortOI: 14000 + (i * 1900),
      txCount: 45 + (i * 7),
    }))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setShards((prev) =>
        prev.map((s) => ({
          ...s,
          txCount: s.txCount + Math.floor(Math.random() * 4),
          longOI: s.longOI + Math.floor((Math.random() - 0.48) * 800),
          shortOI: s.shortOI + Math.floor((Math.random() - 0.48) * 800),
        }))
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel rounded-2xl p-5 text-white w-full border border-purple-500/30">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="font-mono font-bold text-sm text-cyan-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            MONAD BLOCK-STM SHARDED STORAGE MATRIX
          </h4>
          <p className="text-[11px] font-mono text-slate-400">
            16 write-isolated EVM storage slots eliminating parallel transaction collisions
          </p>
        </div>
        <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-500/40">
          0 Aborts • 10,000 TPS Ready
        </span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {shards.map((s) => (
          <div
            key={s.shardId}
            className="bg-[#0C0726]/80 border border-purple-900/40 hover:border-cyan-400/50 rounded-xl p-2.5 text-center transition-all"
          >
            <div className="text-[10px] text-purple-300/80 font-mono mb-1 font-bold">SHARD #{s.shardId}</div>
            <div className="text-xs font-black text-white font-mono">{s.txCount} tx</div>
            <div className="text-[9px] text-emerald-400 font-mono mt-1">L: k</div>
            <div className="text-[9px] text-rose-400 font-mono">S: k</div>
          </div>
        ))}
      </div>
    </div>
  );
};
