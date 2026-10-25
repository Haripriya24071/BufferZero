import React from "react";
import { SimMetrics, SimConfig } from "../../engine/types";
import {
  Activity,
  Zap,
  Cpu,
  Layers,
  HardDrive,
  Clock,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
} from "lucide-react";

interface MetricsPanelProps {
  metrics: SimMetrics;
  config: SimConfig;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  metrics,
  config,
}) => {
  // Generate dynamic plain-English engineering insight based on state
  const getInsight = (): string[] => {
    const lines: string[] = [];

    if (config.blockSizeB <= 16) {
      lines.push(
        "With 16 B blocks, sequential macroblock accesses suffer frequent compulsory misses. Increase block size to 64 B to exploit spatial locality."
      );
    } else if (config.blockSizeB >= 256) {
      lines.push(
        "With large 256 B blocks, bus transfer penalty rises to 208 cycles. Random scrubbing or seeking pollutes the cache with unused data."
      );
    } else {
      lines.push(
        "Optimal 64 B/128 B block size balances spatial prefetching with acceptable bus fill latencies, keeping AMAT low."
      );
    }

    if (config.transferMode === "CPU") {
      lines.push(
        "CPU-driven mode forces the processor into busy load/store copy loops, leaving little CPU time to decode frames."
      );
    } else {
      lines.push(
        "DMA controller offloads bitstream ingestion to hardware, freeing over 80% of CPU cycles for smooth decoding."
      );
    }

    return lines;
  };

  // Verdict calculation
  const getVerdict = (): {
    label: "SMOOTH" | "AT RISK" | "BUFFERING";
    colorClass: string;
  } => {
    if (metrics.isBuffering || metrics.bufferLevelPct <= 0) {
      return {
        label: "BUFFERING",
        colorClass: "bg-[#FF3B30] text-white border-2 border-[#12151A]",
      };
    }
    if (metrics.bufferLevelPct < 35 || metrics.cpuUtilizationFree < 20) {
      return {
        label: "AT RISK",
        colorClass: "bg-[#FFFFFF] text-[#12151A] border-2 border-[#12151A]",
      };
    }
    return {
      label: "SMOOTH",
      colorClass: "bg-[#CCFF00] text-[#12151A] border-2 border-[#12151A]",
    };
  };

  const verdict = getVerdict();
  const insights = getInsight();

  return (
    <div className="card-tactile p-5 space-y-5">
      {/* Top Header with Verdict Chip */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#12151A]/10">
        <div className="flex items-center gap-2">
          <Activity size={18} className="text-[#12151A]" />
          <h3 className="font-display text-base text-[#12151A]">Live Telemetry</h3>
        </div>

        {/* Verdict Chip */}
        <div
          className={`px-3 py-1 rounded-full font-mono text-xs font-black uppercase tracking-wider shadow-[2px_2px_0_#12151A] ${verdict.colorClass}`}
        >
          {verdict.label}
        </div>
      </div>

      {/* Primary Hero Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 font-mono">
        {/* Hit Ratio */}
        <div className="bg-[#FAF8F5] border-2 border-[#12151A] p-3 rounded-lg">
          <span className="text-[10px] text-[#5A6372] block font-bold uppercase">
            Cache Hit Ratio (CO5)
          </span>
          <div className="text-2xl font-extrabold text-[#12151A]">
            {metrics.hitRatio}%
          </div>
          <span className="text-[9px] text-[#5A6372]">
            Miss: {metrics.missRatio}% ({metrics.missPenalty}c penalty)
          </span>
        </div>

        {/* AMAT */}
        <div className="bg-[#FAF8F5] border-2 border-[#12151A] p-3 rounded-lg">
          <span className="text-[10px] text-[#5A6372] block font-bold uppercase">
            AMAT Cycles (CO5)
          </span>
          <div className="text-2xl font-extrabold text-[#12151A]">
            {metrics.amat} <span className="text-xs font-normal">cyc</span>
          </div>
          <span className="text-[9px] text-[#5A6372]">
            Hit time: {config.hitTimeCycles}c + penalty
          </span>
        </div>

        {/* CPU Free % */}
        <div className="bg-[#FAF8F5] border-2 border-[#12151A] p-3 rounded-lg">
          <span className="text-[10px] text-[#5A6372] block font-bold uppercase">
            CPU Headroom (CO4)
          </span>
          <div className={`text-2xl font-extrabold ${
            metrics.cpuUtilizationFree < 25 ? "text-[#FF3B30]" : "text-[#12151A]"
          }`}>
            {metrics.cpuUtilizationFree}% <span className="text-xs font-normal">Free</span>
          </div>
          <span className="text-[9px] text-[#5A6372]">
            {config.transferMode === "CPU" ? "Programmed I/O" : "DMA Controller"}
          </span>
        </div>

        {/* CPI */}
        <div className="bg-[#FAF8F5] border-2 border-[#12151A] p-3 rounded-lg">
          <span className="text-[10px] text-[#5A6372] block font-bold uppercase">
            Pipeline CPI (CO6)
          </span>
          <div className="text-2xl font-extrabold text-[#12151A]">
            {metrics.cpi}
          </div>
          <span className="text-[9px] text-[#5A6372]">
            Stall: +{metrics.stallCycles} cyc/instr
          </span>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="bg-[#F5F2EB] border border-[#12151A] p-3 rounded-lg font-mono text-xs space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-[#5A6372]">Memory Throughput:</span>
          <span className="font-bold text-[#12151A]">{metrics.throughputMBps} MB/s</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#5A6372]">Buffer Health Level:</span>
          <span className={`font-bold ${metrics.isBuffering ? "text-[#FF3B30]" : "text-[#12151A]"}`}>
            {metrics.bufferLevelPct}%
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#5A6372]">
            {config.transferMode === "CPU" ? "CPU-Copied Words:" : "DMA Block Transfers:"}
          </span>
          <span className="font-bold text-[#12151A]">
            {config.transferMode === "CPU"
              ? `${metrics.cpuCopiedWords.toLocaleString()} w/s`
              : `${metrics.dmaTransfers.toLocaleString()} xfers/s`}
          </span>
        </div>
      </div>

      {/* "What's Happening" Plain-English Explainer */}
      <div className="bg-[#12151A] text-white p-4 rounded-lg border-2 border-[#12151A] shadow-[3px_3px_0_#CCFF00]">
        <div className="flex items-center gap-2 mb-2 font-mono text-xs font-bold text-[#CCFF00] uppercase tracking-wider">
          <Zap size={14} />
          <span>What's Happening Inside Hardware</span>
        </div>
        <div className="space-y-2 font-mono text-[11px] text-[#EAE5DB] leading-relaxed">
          {insights.map((insight, idx) => (
            <p key={idx} className="flex items-start gap-1.5">
              <span className="text-[#CCFF00] font-bold">›</span>
              <span>{insight}</span>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};
