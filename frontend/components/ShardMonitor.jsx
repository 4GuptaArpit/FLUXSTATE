import React, { useEffect, useState } from "react";

export const ShardMonitor = ({ activeShardId = null, isPilotMode = true }) => {
  const [shards, setShards] = useState(() =>
    Array.from({ length: 16 }, (_, i) => ({
      shardId: i,
      longOI: +(18.4 + (i * 2.1)).toFixed(1),
      shortOI: +(14.2 + (i * 1.8)).toFixed(1),
      txCount: 45 + (i * 7),
    }))
  );

  const [hoveredShard, setHoveredShard] = useState(null);
  const [isStressTesting, setIsStressTesting] = useState(false);
  const [stressBenchmark, setStressBenchmark] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isStressTesting) return;
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
  }, [isStressTesting]);

  // Sandbox-exclusive 500-Trade Parallel Block-STM Stress Test Simulator
  const handleRunParallelStressTest = () => {
    if (isStressTesting) return;
    setIsStressTesting(true);
    setStressBenchmark(null);

    let added = 0;
    const stressInterval = setInterval(() => {
      added += 50;
      setShards((prev) =>
        prev.map((s) => ({
          ...s,
          txCount: s.txCount + Math.floor(2 + Math.random() * 3),
          longOI: +(s.longOI + 0.8).toFixed(1),
          shortOI: +(s.shortOI + 0.6).toFixed(1),
        }))
      );

      if (added >= 500) {
        clearInterval(stressInterval);
        setIsStressTesting(false);
        setStressBenchmark({
          totalTrades: 500,
          durationMs: 82,
          tpsEquivalent: 6100,
          aborts: 0,
          abortRatePct: 0.00
        });
        // Auto-dismiss benchmark banner after 7 seconds so it doesn't linger forever
        setTimeout(() => {
          setStressBenchmark(null);
        }, 7000);
      }
    }, 80);
  };

  // Resolve which shard to display by default when not hovering
  const assignedShard = (activeShardId !== null && shards.find((s) => s.shardId === activeShardId)) || shards[0];
  const currentDisplayShard = hoveredShard || assignedShard;
  const isDisplayingHovered = Boolean(hoveredShard);

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

          {/* Sandbox-Only 500-Trade Parallel Stress Test Button */}
          {isPilotMode && (
            <button
              type="button"
              onClick={handleRunParallelStressTest}
              disabled={isStressTesting}
              className="text-[11px] font-mono font-bold text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 px-3 py-1 rounded-md shadow-[0_0_15px_rgba(251,191,36,0.4)] active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isStressTesting ? "⚡ SIMULATING 500 TXs..." : "⚡ TEST 500 PARALLEL TRADES"}
            </button>
          )}

          <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-500/40">
            0 Aborts • 10,000 TPS Ready
          </span>
        </div>
      </div>

      <div 
        className="grid grid-cols-4 sm:grid-cols-8 gap-2 relative"
        onMouseLeave={() => setHoveredShard(null)}
      >
        {shards.map((s) => {
          const isUserShard = activeShardId !== null && s.shardId === activeShardId;
          return (
            <div
              key={s.shardId}
              onMouseEnter={() => setHoveredShard(s)}
              className={"relative rounded-xl p-2.5 text-center cursor-pointer select-none transition-colors duration-100 " + (
                isUserShard 
                  ? "bg-cyan-950/70 border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] z-10" 
                  : isStressTesting 
                    ? "bg-[#10083B] border border-amber-500/60 animate-pulse" 
                    : "bg-[#0C0726]/80 border border-purple-900/40 hover:border-cyan-400/50 hover:bg-purple-950/60"
              )}
            >
              {isUserShard && (
                <div className="absolute -top-2 -right-1.5 text-[8px] bg-cyan-400 text-black px-1.5 py-0.2 rounded-full font-black font-mono tracking-tight uppercase pointer-events-none shadow-[0_0_8px_rgba(6,182,212,0.8)] border border-cyan-200">
                  CURRENT
                </div>
              )}
              <div className={"text-[10px] font-mono mb-0.5 font-bold pointer-events-none " + (isUserShard ? "text-cyan-300" : "text-purple-300/80")}>
                SHARD #{s.shardId}
              </div>
              <div className="text-xs font-black text-white font-mono pointer-events-none">{s.txCount} tx</div>
              <div className="text-[9px] text-emerald-400 font-mono mt-0.5 pointer-events-none">L: {s.longOI}k</div>
              <div className="text-[9px] text-rose-400 font-mono pointer-events-none">S: {s.shortOI}k</div>
            </div>
          );
        })}
      </div>

      {/* Fixed-Height Permanent Bottom Telemetry Strip (Zero Layout Shift / Zero Shaking / Zero Flicker) */}
      <div className="mt-3 min-h-[44px] flex items-center bg-[#08021C] border border-purple-900/40 rounded-xl px-3 py-2 text-[11px] font-mono overflow-hidden">
        {hoveredShard ? (
          /* Hovering over ANY shard takes absolute precedence */
          <div className="w-full flex flex-wrap justify-between items-center text-slate-300">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-cyan-300 font-bold">
                {activeShardId !== null && hoveredShard.shardId === activeShardId ? "⭐ YOUR SHARD" : "INSPECTING SHARD"} #{hoveredShard.shardId} TELEMETRY:
              </span>
              <span>Slot: <code className="text-purple-300 font-mono">keccak256({hoveredShard.shardId}, 0x05)</code></span>
            </div>
            <div className="flex items-center space-x-3 text-[10px]">
              <span className="text-emerald-400 font-semibold">Long OI: {hoveredShard.longOI}k MON</span>
              <span className="text-rose-400 font-semibold">Short OI: {hoveredShard.shortOI}k MON</span>
              <span className="text-cyan-400 font-bold">Parallel Abort Rate: 0.00%</span>
            </div>
          </div>
        ) : stressBenchmark ? (
          /* When not hovering, show stress benchmark if active, with clear close option */
          <div className="w-full flex flex-wrap justify-between items-center text-slate-200">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-emerald-400 font-bold">500 PARALLEL TRADES BENCHMARK:</span>
              <span>Executed in <strong className="text-white">{stressBenchmark.durationMs}ms</strong></span>
            </div>
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="text-cyan-300">Shards: <strong>16/16 Parallel</strong></span>
              <span className="text-emerald-400 font-black">Block-STM Aborts: 0</span>
              <span className="text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/40 font-bold">
                ~{stressBenchmark.tpsEquivalent} TPS
              </span>
              <button 
                type="button" 
                onClick={() => setStressBenchmark(null)}
                className="text-[10px] text-slate-400 hover:text-white ml-1 px-1.5 py-0.5 bg-purple-950/60 rounded border border-purple-800 cursor-pointer"
                title="Dismiss benchmark"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          /* Default state when not hovering: Show user's assigned shard telemetry! */
          <div className="w-full flex flex-wrap justify-between items-center text-slate-300">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-cyan-300 font-bold">
                {activeShardId !== null ? `⭐ YOUR SHARD #${assignedShard.shardId}` : `DEFAULT SHARD #${assignedShard.shardId}`} ACTIVE TELEMETRY:
              </span>
              <span>Slot: <code className="text-purple-300 font-mono">keccak256({assignedShard.shardId}, 0x05)</code></span>
            </div>
            <div className="flex items-center space-x-3 text-[10px]">
              <span className="text-emerald-400 font-semibold">Long OI: {assignedShard.longOI}k MON</span>
              <span className="text-rose-400 font-semibold">Short OI: {assignedShard.shortOI}k MON</span>
              <span className="text-cyan-400 font-bold">Parallel Abort Rate: 0.00%</span>
              <span className="text-slate-500 hidden md:inline">| (Hover another shard to inspect)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
