import React, { useEffect, useState } from "react";

export const ShardMonitor = ({ activeShardId = null }) => {
  const [shards, setShards] = useState(() =>
    Array.from({ length: 16 }, (_, i) => ({
      shardId: i,
      longOI: +(18.4 + (i * 2.1)).toFixed(1),
      shortOI: +(14.2 + (i * 1.8)).toFixed(1),
      txCount: 45 + (i * 7),
    }))
  );

  const [hoveredShard, setHoveredShard] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setShards((prev) =>
        prev.map((s) => ({
          ...s,
          txCount: s.txCount + Math.floor(Math.random() * 3),
          longOI: Math.max(1, +(s.longOI + (Math.random() - 0.48) * 0.4).toFixed(1)),
          shortOI: Math.max(1, +(s.shortOI + (Math.random() - 0.48) * 0.4).toFixed(1)),
        }))
      );
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel rounded-2xl p-5 text-white w-full border border-purple-500/30">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <div>
          <h4 className="font-mono font-bold text-sm text-cyan-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            MONAD BLOCK-STM SHARDED STORAGE MATRIX
          </h4>
          <p className="text-[11px] font-mono text-slate-400">
            16 write-isolated EVM storage slots eliminating parallel transaction collisions
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {activeShardId !== null && (
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/90 px-2.5 py-1 rounded-md border border-cyan-400/50 flex items-center gap-1 shadow-[0_0_12px_rgba(6,182,212,0.3)] animate-pulse">
              <span>⭐</span>
              <span>YOUR SHARD: #{activeShardId}</span>
            </span>
          )}
          <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-500/40">
            0 Aborts • 10,000 TPS Ready
          </span>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 relative">
        {shards.map((s) => {
          const isUserShard = activeShardId !== null && s.shardId === activeShardId;
          return (
            <div
              key={s.shardId}
              onMouseEnter={() => setHoveredShard(s)}
              onMouseLeave={() => setHoveredShard(null)}
              className={"relative rounded-xl p-2.5 text-center transition-all cursor-pointer " + (
                isUserShard 
                  ? "bg-cyan-950/70 border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105 z-10" 
                  : "bg-[#0C0726]/80 border border-purple-900/40 hover:border-cyan-400/50 hover:bg-purple-950/40"
              )}
            >
              {isUserShard && (
                <div className="absolute -top-1.5 -right-1 text-[8px] bg-cyan-400 text-black px-1 rounded font-black font-mono uppercase">
                  YOU
                </div>
              )}
              <div className={"text-[10px] font-mono mb-0.5 font-bold " + (isUserShard ? "text-cyan-300" : "text-purple-300/80")}>
                SHARD #{s.shardId}
              </div>
              <div className="text-xs font-black text-white font-mono">{s.txCount} tx</div>
              <div className="text-[9px] text-emerald-400 font-mono mt-0.5">L: {s.longOI}k</div>
              <div className="text-[9px] text-rose-400 font-mono">S: {s.shortOI}k</div>
            </div>
          );
        })}
      </div>

      {/* Live Shard Telemetry Hover Inspector */}
      {hoveredShard && (
        <div className="mt-3 bg-[#08021C] border border-cyan-500/30 rounded-xl p-2.5 text-[11px] font-mono flex flex-wrap justify-between items-center text-slate-300 animate-in fade-in duration-150">
          <div className="flex items-center space-x-2">
            <span className="text-cyan-300 font-bold">SHARD #{hoveredShard.shardId} TELEMETRY:</span>
            <span>Slot: <code className="text-purple-300">keccak256({hoveredShard.shardId}, 0x05)</code></span>
          </div>
          <div className="flex items-center space-x-3 text-[10px]">
            <span className="text-emerald-400">Long OI: {hoveredShard.longOI}k MON</span>
            <span className="text-rose-400">Short OI: {hoveredShard.shortOI}k MON</span>
            <span className="text-cyan-400 font-bold">Parallel Abort Rate: 0.00%</span>
          </div>
        </div>
      )}
    </div>
  );
};
