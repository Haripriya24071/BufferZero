import React from "react";
import { Flame, Wind, Snowflake, AlertTriangle } from "lucide-react";

interface BreakItDeckProps {
  onSeekStorm: () => void;
  onColdFlush: () => void;
  onNetworkBurst: () => void;
}

export const BreakItDeck: React.FC<BreakItDeckProps> = ({
  onSeekStorm,
  onColdFlush,
  onNetworkBurst,
}) => {
  return (
    <div className="card-tactile p-4 space-y-3 bg-[#FFFFFF]">
      <div className="flex items-center justify-between pb-2 border-b border-[#171717]/10">
        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#171717]">
          <Flame size={15} className="text-[#FF3B30]" />
          <span>"BREAK-IT" HARDWARE STRESS TEST DECK</span>
        </div>
        <span className="text-[10px] font-mono text-[#5A6372]">
          Edge-Case Analysis
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Button 1: Seek Storm */}
        <button
          onClick={onSeekStorm}
          className="p-3 rounded-lg border-2 border-[#171717] bg-[#F5F5F0] hover:bg-[#EBEBE6] shadow-[3px_3px_0_#171717] active:translate-y-0.5 text-left transition-all"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-xs font-bold text-[#171717]">
              🌪️ Seek Storm
            </span>
            <Wind size={14} className="text-[#171717]" />
          </div>
          <p className="text-[10px] font-mono text-[#5A6372] leading-tight">
            Forces sudden video scrubbing. Demonstrates spatial cache thrashing.
          </p>
        </button>

        {/* Button 2: Cold Cache Flush */}
        <button
          onClick={onColdFlush}
          className="p-3 rounded-lg border-2 border-[#171717] bg-[#F5F5F0] hover:bg-[#EBEBE6] shadow-[3px_3px_0_#171717] active:translate-y-0.5 text-left transition-all"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-xs font-bold text-[#171717]">
              ❄️ Cold Flush
            </span>
            <Snowflake size={14} className="text-[#02167F]" />
          </div>
          <p className="text-[10px] font-mono text-[#5A6372] leading-tight">
            Invalidates all cache lines. Tests compulsory miss latency.
          </p>
        </button>

        {/* Button 3: Network Burst */}
        <button
          onClick={onNetworkBurst}
          className="p-3 rounded-lg border-2 border-[#171717] bg-[#D7FF38] hover:bg-[#BBEE00] shadow-[3px_3px_0_#171717] active:translate-y-0.5 text-left transition-all"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-xs font-extrabold text-[#171717]">
              ⚡ Network Burst
            </span>
            <AlertTriangle size={14} className="text-[#171717]" />
          </div>
          <p className="text-[10px] font-mono text-[#171717] leading-tight">
            Spikes incoming packet bitrate. Tests DMA vs CPU saturation limit.
          </p>
        </button>
      </div>
    </div>
  );
};
