import React from "react";
import { SimMetrics, SimConfig } from "../../engine/types";
import { HardDrive, Radio, Activity } from "lucide-react";

interface TelemetryHUDProps {
  metrics: SimMetrics;
  config: SimConfig;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({ metrics, config }) => {
  // AMAT curve health assessment
  const getAmatHealth = () => {
    if (config.blockSizeB === 64 || config.blockSizeB === 128) {
      return { text: "OPTIMAL U-CURVE", color: "bg-[#D7FF38] text-[#171717]" };
    }
    if (config.blockSizeB < 64) {
      return { text: "HIGH MISS RATE", color: "bg-[#FFFFFF] text-[#FF3B30]" };
    }
    return { text: "HIGH BUS LATENCY", color: "bg-[#FFFFFF] text-[#FF3B30]" };
  };

  const amatHealth = getAmatHealth();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
      {/* 1. AMAT (Average Memory Access Time) */}
      <div className="bg-[#FFFFFF] border-2 border-[#171717] p-4 rounded-xl shadow-[4px_4px_0_#171717] hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-[#525252] uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={14} className="text-[#2457FF]" />
            <span>Memory Latency (AMAT)</span>
          </span>
          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-[#171717] ${amatHealth.color}`}>
            {amatHealth.text}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-3xl sm:text-4xl font-black text-[#171717]">
            {metrics.amat}
          </span>
          <span className="text-xs text-[#525252] font-bold">cycles / access</span>
        </div>
        <div className="mt-2 pt-2 border-t border-[#171717]/10 flex items-center justify-between text-[10px] text-[#525252]">
          <span>Hit: {config.hitTimeCycles}c</span>
          <span>Penalty: {metrics.missPenalty}c</span>
        </div>
      </div>

      {/* 2. Cache Hit Ratio */}
      <div className="bg-[#FFFFFF] border-2 border-[#171717] p-4 rounded-xl shadow-[4px_4px_0_#2457FF] hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-[#525252] uppercase tracking-wider flex items-center gap-1.5">
            <HardDrive size={14} className="text-[#2457FF]" />
            <span>Cache Hit Rate</span>
          </span>
          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-[#171717] bg-[#F5F5F0] text-[#171717]">
            {config.blockSizeB}B BLOCKS
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-3xl sm:text-4xl font-black text-[#2457FF]">
            {metrics.hitRatio}%
          </span>
          <span className="text-xs text-[#525252] font-bold">hit ratio</span>
        </div>
        <div className="mt-2 pt-2 border-t border-[#171717]/10 flex items-center justify-between text-[10px] text-[#525252]">
          <span>Miss: {metrics.missRatio}%</span>
          <span>Associativity: {config.associativity}-Way</span>
        </div>
      </div>

      {/* 3. CPU Headroom / DMA Offloading */}
      <div className="bg-[#FFFFFF] border-2 border-[#171717] p-4 rounded-xl shadow-[4px_4px_0_#171717] hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-bold text-[#525252] uppercase tracking-wider flex items-center gap-1.5">
            <Radio size={14} className={config.transferMode === "DMA" ? "text-[#2457FF]" : "text-[#FF3B30]"} />
            <span>CPU Free Headroom</span>
          </span>
          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-[#171717] ${
            config.transferMode === "DMA" ? "bg-[#2457FF] text-white" : "bg-[#FF3B30] text-white"
          }`}>
            {config.transferMode === "DMA" ? "DMA ACTIVE" : "CPU BOUND"}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className={`font-display text-3xl sm:text-4xl font-black ${
            metrics.cpuUtilizationFree >= 50 ? "text-[#171717]" : "text-[#FF3B30]"
          }`}>
            {Math.round(metrics.cpuUtilizationFree)}%
          </span>
          <span className="text-xs text-[#525252] font-bold">free cycles</span>
        </div>
        <div className="mt-2 pt-2 border-t border-[#171717]/10 flex items-center justify-between text-[10px] text-[#525252]">
          <span>{config.transferMode === "DMA" ? "Hardware Offload" : "Programmed I/O Loop"}</span>
          <span>CPI: {metrics.cpi}</span>
        </div>
      </div>
    </div>
  );
};
