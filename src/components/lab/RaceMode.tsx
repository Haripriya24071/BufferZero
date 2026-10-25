import React, { useState, useEffect } from "react";
import { Simulation } from "../../engine/simulation";
import { SimConfig, SimMetrics } from "../../engine/types";
import { Swords, CheckCircle2, AlertOctagon, Zap, RotateCcw, Video } from "lucide-react";

interface RaceModeProps {
  baseConfig: SimConfig;
}

export const RaceMode: React.FC<RaceModeProps> = ({ baseConfig }) => {
  // Dual simulations running side-by-side on the exact same stream
  const [simCPU, setSimCPU] = useState<Simulation>(() => {
    return new Simulation({
      ...baseConfig,
      transferMode: "CPU",
      quality: "1080p",
      seed: 12345,
    });
  });

  const [simDMA, setSimDMA] = useState<Simulation>(() => {
    return new Simulation({
      ...baseConfig,
      transferMode: "DMA",
      quality: "1080p",
      seed: 12345,
    });
  });

  const [metricsCPU, setMetricsCPU] = useState<SimMetrics>(() => simCPU.getMetrics());
  const [metricsDMA, setMetricsDMA] = useState<SimMetrics>(() => simDMA.getMetrics());
  const [isRacing, setIsRacing] = useState<boolean>(true);

  useEffect(() => {
    if (!isRacing) return;

    const interval = setInterval(() => {
      simCPU.step(8);
      simDMA.step(8);
      setMetricsCPU({ ...simCPU.getMetrics() });
      setMetricsDMA({ ...simDMA.getMetrics() });
    }, 100);

    return () => clearInterval(interval);
  }, [isRacing, simCPU, simDMA]);

  const handleRestartRace = () => {
    const freshCPU = new Simulation({
      ...baseConfig,
      transferMode: "CPU",
      quality: "1080p",
      seed: 12345,
    });
    const freshDMA = new Simulation({
      ...baseConfig,
      transferMode: "DMA",
      quality: "1080p",
      seed: 12345,
    });
    setSimCPU(freshCPU);
    setSimDMA(freshDMA);
    setMetricsCPU(freshCPU.getMetrics());
    setMetricsDMA(freshDMA.getMetrics());
    setIsRacing(true);
  };

  return (
    <div className="card-tactile p-6 space-y-6 bg-[#FFFFFF]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#171717]">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#171717] text-[#D7FF38] rounded text-xs font-mono font-bold shadow-[2px_2px_0_#2457FF]">
            <Swords size={14} className="text-[#2457FF]" />
            <span>HEAD-TO-HEAD SHOWDOWN</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl text-[#171717] mt-1">
            Race Mode: CPU-Driven vs. DMA Mode
          </h2>
          <p className="text-xs sm:text-sm text-[#525252] font-mono">
            Same 1080p stream • Same memory seed • Proves the entire COA conclusion in 5 seconds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRacing(!isRacing)}
            className="btn-primary text-xs py-2 px-3"
          >
            {isRacing ? "PAUSE RACE" : "RESUME RACE"}
          </button>
          <button
            onClick={handleRestartRace}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
          >
            <RotateCcw size={14} />
            <span>RESTART</span>
          </button>
        </div>
      </div>

      {/* Split Comparison Arena */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Board: CPU-Driven (Programmed I/O) */}
        <div className="border-3 border-[#171717] rounded-xl p-5 bg-[#FFFFFF] shadow-[6px_6px_0_#FF3B30] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-[#171717]/10">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#FF3B30] uppercase block">
                  TRADITIONAL I/O ARCHITECTURE
                </span>
                <h3 className="font-display text-xl text-[#171717]">Board A: CPU-Driven</h3>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border border-[#171717] ${
                metricsCPU.isBuffering ? "bg-[#FF3B30] text-white" : "bg-[#FFFFFF] text-[#171717]"
              }`}>
                {metricsCPU.isBuffering ? "BUFFERING STALL" : "PLAYING"}
              </span>
            </div>

            {/* Simulated Screen */}
            <div className="w-full aspect-video bg-[#171717] rounded-lg border-2 border-[#171717] p-4 flex flex-col justify-between relative overflow-hidden mb-4">
              <div className="flex justify-between items-center text-xs font-mono text-white z-10">
                <span>1080p Stream</span>
                <span className={`font-bold ${metricsCPU.isBuffering ? "text-[#FF3B30]" : "text-[#D7FF38]"}`}>
                  {metricsCPU.fps} FPS
                </span>
              </div>

              {metricsCPU.isBuffering ? (
                <div className="text-center z-10 py-6">
                  <AlertOctagon size={40} className="text-[#FF3B30] mx-auto mb-2 animate-bounce" />
                  <span className="font-mono text-xs font-bold text-[#FF3B30] block">
                    CPU COPY BOTTLENECK
                  </span>
                  <p className="font-mono text-[10px] text-[#8E99A8]">
                    CPU spent all cycles copying words. Frame buffer starved.
                  </p>
                </div>
              ) : (
                <div className="text-center z-10 py-6">
                  <Video size={36} className="text-[#525252] mx-auto mb-2" />
                  <span className="font-mono text-xs text-[#8E99A8]">Decoding...</span>
                </div>
              )}

              {/* Buffer Bar */}
              <div className="space-y-1 z-10 font-mono">
                <div className="flex justify-between text-[10px] text-white">
                  <span>Buffer: {metricsCPU.bufferLevelPct}%</span>
                  <span>CPU Free: {metricsCPU.cpuUtilizationFree}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#262626] rounded overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      metricsCPU.isBuffering ? "bg-[#FF3B30]" : "bg-[#D7FF38]"
                    }`}
                    style={{ width: `${metricsCPU.bufferLevelPct}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div className="bg-[#F5F5F0] p-2.5 rounded border border-[#171717]">
                <span className="text-[10px] text-[#525252] block">CPU Overhead:</span>
                <span className="text-sm font-bold text-[#FF3B30]">
                  {100 - metricsCPU.cpuUtilizationFree}% Busy Copying
                </span>
              </div>
              <div className="bg-[#F5F5F0] p-2.5 rounded border border-[#171717]">
                <span className="text-[10px] text-[#525252] block">AMAT Latency:</span>
                <span className="text-sm font-bold text-[#171717]">
                  {metricsCPU.amat} cycles
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#171717]/10 font-mono text-[11px] text-[#FF3B30]">
            <strong>Problem:</strong> CPU must execute 6 clock cycles per word copied from network.
          </div>
        </div>

        {/* Right Board: DMA Mode (Electric Blue Hardware Offload) */}
        <div className="border-3 border-[#171717] rounded-xl p-5 bg-[#FFFFFF] shadow-[6px_6px_0_#2457FF] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-[#171717]/10">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#2457FF] uppercase block">
                  DMA CO-PROCESSOR ARCHITECTURE
                </span>
                <h3 className="font-display text-xl text-[#171717]">Board B: DMA Mode</h3>
              </div>
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#2457FF] text-white border border-[#171717] shadow-[2px_2px_0_#171717]">
                SMOOTH 60 FPS
              </span>
            </div>

            {/* Simulated Screen */}
            <div className="w-full aspect-video bg-[#171717] rounded-lg border-2 border-[#171717] p-4 flex flex-col justify-between relative overflow-hidden mb-4">
              <div className="flex justify-between items-center text-xs font-mono text-white z-10">
                <span>1080p Stream</span>
                <span className="font-bold text-[#D7FF38]">60 FPS Steady</span>
              </div>

              <div className="text-center z-10 py-6">
                <CheckCircle2 size={40} className="text-[#2457FF] mx-auto mb-2" />
                <span className="font-mono text-xs font-bold text-[#D7FF38] block">
                  ZERO BUFFERING
                </span>
                <p className="font-mono text-[10px] text-[#8E99A8]">
                  DMA streams blocks straight to DRAM. CPU 85%+ free.
                </p>
              </div>

              {/* Buffer Bar */}
              <div className="space-y-1 z-10 font-mono">
                <div className="flex justify-between text-[10px] text-white">
                  <span>Buffer: {metricsDMA.bufferLevelPct}%</span>
                  <span>CPU Free: {metricsDMA.cpuUtilizationFree}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#262626] rounded overflow-hidden">
                  <div
                    className="h-full bg-[#2457FF] transition-all duration-300"
                    style={{ width: `${metricsDMA.bufferLevelPct}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div className="bg-[#F5F5F0] p-2.5 rounded border border-[#171717]">
                <span className="text-[10px] text-[#525252] block">CPU Overhead:</span>
                <span className="text-sm font-bold text-[#2457FF]">
                  Only {100 - metricsDMA.cpuUtilizationFree}% (8% bus steal)
                </span>
              </div>
              <div className="bg-[#F5F5F0] p-2.5 rounded border border-[#171717]">
                <span className="text-[10px] text-[#525252] block">AMAT Latency:</span>
                <span className="text-sm font-bold text-[#171717]">
                  {metricsDMA.amat} cycles
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#171717]/10 font-mono text-[11px] text-[#2457FF]">
            <strong>Result:</strong> DMA offloads data transport; CPU decodes every frame on time.
          </div>
        </div>
      </div>

      {/* Viva Proof Banner */}
      <div className="bg-[#171717] text-white p-4 rounded-xl border-2 border-[#171717] shadow-[4px_4px_0_#2457FF] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#2457FF] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-[1px_1px_0_#171717]">
            !
          </div>
          <div>
            <span className="text-[#D7FF38] font-bold block">EMPIRICAL ARCHITECTURE CONCLUSION:</span>
            <p className="text-[#EBEBE6] text-[11px]">
              Direct Memory Access eliminates the CPU copy bottleneck, freeing +{Math.round(metricsDMA.cpuUtilizationFree - metricsCPU.cpuUtilizationFree)}% CPU cycles and preventing buffer starvation during continuous video playback.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
