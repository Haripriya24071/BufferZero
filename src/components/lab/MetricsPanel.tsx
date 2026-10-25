import React from "react";
import { SimMetrics, SimConfig } from "../../engine/types";
import { Zap, Terminal, Activity, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";

interface MetricsPanelProps {
  metrics: SimMetrics;
  config: SimConfig;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({
  metrics,
  config,
}) => {
  // Generate dynamic plain-English engineering insight based on state
  const getInsights = (): { title: string; text: string; status: "good" | "warn" | "neutral" }[] => {
    const items: { title: string; text: string; status: "good" | "warn" | "neutral" }[] = [];

    // 1. Cache Block Size Analysis (CO5)
    if (config.blockSizeB <= 16) {
      items.push({
        title: "Block Size (16B): Spatial Thrashing",
        text: "Blocks are too small to exploit sequential video macroblock locality. CPU suffers repeated compulsory misses.",
        status: "warn",
      });
    } else if (config.blockSizeB >= 256) {
      items.push({
        title: "Block Size (256B): Bus Transfer Penalty",
        text: "Bus fill penalty escalates to 208 cycles per miss. Transfer latency stalls the pipeline on seeks.",
        status: "warn",
      });
    } else {
      items.push({
        title: `Block Size (${config.blockSizeB}B): Optimal Spatial Locality`,
        text: "Near-ideal balance: pre-fetches contiguous macroblocks while keeping bus refill cycles under 50 cycles.",
        status: "good",
      });
    }

    // 2. Transfer Mode Analysis (CO4)
    if (config.transferMode === "CPU") {
      items.push({
        title: "I/O Mode: CPU Programmed I/O Bottleneck",
        text: "The CPU is trapped in tight load/store copy loops (6 cycles/word), stealing cycles needed for video decode.",
        status: "warn",
      });
    } else {
      items.push({
        title: "I/O Mode: DMA Hardware Autonomous Transfer",
        text: "DMA engine transfers packets directly from NIC to DRAM, freeing >80% CPU headroom for 60 FPS decoding.",
        status: "good",
      });
    }

    return items;
  };

  const insights = getInsights();

  return (
    <div className="card-tactile p-4 space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717]/10">
        <div className="flex items-center gap-2">
          <Terminal size={17} className="text-[#2457FF]" />
          <h4 className="font-display text-sm uppercase tracking-wider text-[#171717]">
            Hardware Logic Explainer (CO4 / CO5)
          </h4>
        </div>
        <span className="text-[10px] font-mono font-bold text-[#525252] flex items-center gap-1">
          <Activity size={12} className="text-[#2457FF]" />
          <span>REAL-TIME ANALYSIS</span>
        </span>
      </div>

      {/* Structured Diagnostic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {insights.map((item, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg border-2 font-mono text-xs space-y-1 ${
              item.status === "good"
                ? "bg-[#FFFFFF] border-[#171717] shadow-[2px_2px_0_#2457FF]"
                : "bg-[#FFF9F9] border-[#FF3B30] shadow-[2px_2px_0_#FF3B30]"
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              {item.status === "good" ? (
                <ShieldCheck size={14} className="text-[#2457FF] shrink-0" />
              ) : (
                <AlertCircle size={14} className="text-[#FF3B30] shrink-0" />
              )}
              <span className={item.status === "good" ? "text-[#171717]" : "text-[#FF3B30]"}>
                {item.title}
              </span>
            </div>
            <p className="text-[11px] text-[#525252] leading-relaxed">
              {item.text}
            </p>
          </div>
        ))}
      </div>

      {/* Secondary Architecture Telemetry Strip */}
      <div className="bg-[#171717] text-white p-3 rounded-lg border-2 border-[#171717] flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-[#D7FF38]" />
          <span className="text-[#A3A3A3]">Bus Bandwidth:</span>
          <span className="font-bold text-[#FFFFFF]">{metrics.throughputMBps} MB/s</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#A3A3A3]">CPI:</span>
          <span className="font-bold text-[#D7FF38]">{metrics.cpi}</span>
          <span className="text-[10px] text-[#A3A3A3]">({metrics.stallCycles} stall cyc)</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#A3A3A3]">
            {config.transferMode === "DMA" ? "DMA Blocks:" : "CPU Copied Words:"}
          </span>
          <span className="font-bold text-[#2457FF]">
            {config.transferMode === "DMA"
              ? `${metrics.dmaTransfers.toLocaleString()} xfers`
              : `${metrics.cpuCopiedWords.toLocaleString()} words`}
          </span>
        </div>
      </div>
    </div>
  );
};
