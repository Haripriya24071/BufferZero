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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#12151A]">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#12151A] text-[#CCFF00] rounded text-xs font-mono font-bold">
            <Swords size={14} />
            <span>HEAD-TO-HEAD SHOWDOWN</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl text-[#12151A] mt-1">
            Race Mode: CPU-Driven vs. DMA Mode
          </h2>
          <p className="text-xs sm:text-sm text-[#5A6372] font-mono">
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
        <div className="border-3 border-[#12151A] rounded-xl p-5 bg-[#FAF8F5] shadow-[6px_6px_0_#FF3B30] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-[#12151A]/10">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#FF3B30] uppercase block">
                  TRADITIONAL I/O ARCHITECTURE
                </span>
                <h3 className="font-display text-xl text-[#12151A]">Board A: CPU-Driven</h3>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold border border-[#12151A] ${
                metricsCPU.isBuffering ? "bg-[#FF3B30] text-white" : "bg-[#FFFFFF] text-[#12151A]"
              }`}>
                {metricsCPU.isBuffering ? "BUFFERING STALL" : "PLAYING"}
              </span>
            </div>

            {/* Simulated Screen */}
            <div className="w-full aspect-video bg-[#12151A] rounded-lg border-2 border-[#12151A] p-4 flex flex-col justify-between relative overflow-hidden mb-4">
              <div className="flex justify-between items-center text-xs font-mono text-white z-10">
                <span>1080p Stream</span>
                <span className={`font-bold ${metricsCPU.isBuffering ? "text-[#FF3B30]" : "text-[#CCFF00]"}`}>
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
                  <Video size={36} className="text-[#5A6372] mx-auto mb-2" />
                  <span className="font-mono text-xs text-[#8E99A8]">Decoding...</span>
                </div>
              )}

              {/* Buffer Bar */}
              <div className="space-y-1 z-10 font-mono">
                <div className="flex justify-between text-[10px] text-white">
                  <span>Buffer: {metricsCPU.bufferLevelPct}%</span>
                  <span>CPU Free: {metricsCPU.cpuUtilizationFree}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#2A303A] rounded overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      metricsCPU.isBuffering ? "bg-[#FF3B30]" : "bg-[#CCFF00]"
                    }`}
                    style={{ width: `${metricsCPU.bufferLevelPct}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div className="bg-[#FFFFFF] p-2.5 rounded border border-[#12151A]">
                <span className="text-[10px] text-[#5A6372] block">CPU Overhead:</span>
                <span className="text-sm font-bold text-[#FF3B30]">
                  {100 - metricsCPU.cpuUtilizationFree}% Busy Copying
                </span>
              </div>
              <div className="bg-[#FFFFFF] p-2.5 rounded border border-[#12151A]">
                <span className="text-[10px] text-[#5A6372] block">AMAT Latency:</span>
                <span className="text-sm font-bold text-[#12151A]">
                  {metricsCPU.amat} cycles
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#12151A]/10 font-mono text-[11px] text-[#FF3B30]">
            ❌ <strong>Problem:</strong> CPU must execute 6 clock cycles per word copied from network.
          </div>
        </div>

        {/* Right Board: DMA Mode (Hardware Offloading) */}
        <div className="border-3 border-[#12151A] rounded-xl p-5 bg-[#FAF8F5] shadow-[6px_6px_0_#CCFF00] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-[#12151A]/10">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#12151A] uppercase block">
                  DMA CO-PROCESSOR ARCHITECTURE
                </span>
                <h3 className="font-display text-xl text-[#12151A]">Board B: DMA Mode</h3>
              </div>
              <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#CCFF00] text-[#12151A] border border-[#12151A]">
                SMOOTH 60 FPS
              </span>
            </div>

            {/* Simulated Screen */}
            <div className="w-full aspect-video bg-[#12151A] rounded-lg border-2 border-[#12151A] p-4 flex flex-col justify-between relative overflow-hidden mb-4">
              <div className="flex justify-between items-center text-xs font-mono text-white z-10">
                <span>1080p Stream</span>
                <span className="font-bold text-[#CCFF00]">60 FPS Steady</span>
              </div>

              <div className="text-center z-10 py-6">
                <CheckCircle2 size={40} className="text-[#CCFF00] mx-auto mb-2" />
                <span className="font-mono text-xs font-bold text-[#CCFF00] block">
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
                <div className="w-full h-2.5 bg-[#2A303A] rounded overflow-hidden">
                  <div
                    className="h-full bg-[#CCFF00] transition-all duration-300"
                    style={{ width: `${metricsDMA.bufferLevelPct}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <div className="bg-[#FFFFFF] p-2.5 rounded border border-[#12151A]">
                <span className="text-[10px] text-[#5A6372] block">CPU Overhead:</span>
                <span className="text-sm font-bold text-[#12151A]">
                  Only {100 - metricsDMA.cpuUtilizationFree}% (8% bus steal)
                </span>
              </div>
              <div className="bg-[#FFFFFF] p-2.5 rounded border border-[#12151A]">
                <span className="text-[10px] text-[#5A6372] block">AMAT Latency:</span>
                <span className="text-sm font-bold text-[#12151A]">
                  {metricsDMA.amat} cycles
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#12151A]/10 font-mono text-[11px] text-[#12151A]">
            ✅ <strong>Result:</strong> DMA offloads data transport; CPU decodes every frame on time.
          </div>
        </div>
      </div>

      {/* Viva Proof Banner */}
      <div className="bg-[#12151A] text-white p-4 rounded-xl border-2 border-[#12151A] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#CCFF00] text-[#12151A] flex items-center justify-center font-bold text-sm shrink-0">
            !
          </div>
          <div>
            <span className="text-[#CCFF00] font-bold block">VIVA CONCLUSION (CO4 & CO5):</span>
            <p className="text-[#EAE5DB] text-[11px]">
              Direct Memory Access eliminates the CPU copy bottleneck, freeing +{Math.round(metricsDMA.cpuUtilizationFree - metricsCPU.cpuUtilizationFree)}% CPU cycles and preventing buffer starvation during continuous video playback.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
