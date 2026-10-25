import React, { useState, useEffect, useRef } from "react";
import { Simulation, DEFAULT_CONFIG } from "../engine/simulation";
import { SimConfig, SimMetrics, SimStep } from "../engine/types";
import { LabHeader } from "../components/lab/LabHeader";
import { Controls } from "../components/lab/Controls";
import { Motherboard3D } from "../components/lab/Motherboard3D";
import { CacheVisualizer } from "../components/lab/CacheVisualizer";
import { PlayerSim } from "../components/lab/PlayerSim";
import { MetricsPanel } from "../components/lab/MetricsPanel";
import { RaceMode } from "../components/lab/RaceMode";
import { RewindDebugger } from "../components/lab/RewindDebugger";
import { BreakItDeck } from "../components/lab/BreakItDeck";
import { HandCheckPanel } from "../components/lab/HandCheckPanel";
import { ChartsView } from "../components/lab/ChartsView";
import { PipelineView } from "../components/lab/PipelineView";
import { AutoAnalyzeModal } from "../components/lab/AutoAnalyzeModal";
import { FacultyReport } from "../components/lab/FacultyReport";
import {
  TrendingUp,
  GitCommit,
  History,
  Calculator,
} from "lucide-react";

export const LabPage: React.FC = () => {
  const [config, setConfig] = useState<SimConfig>(DEFAULT_CONFIG);
  const simRef = useRef<Simulation>(new Simulation(DEFAULT_CONFIG));

  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [activePreset, setActivePreset] = useState<string>("balanced");
  const [isRaceMode, setIsRaceMode] = useState<boolean>(false);

  const [metrics, setMetrics] = useState<SimMetrics>(() => simRef.current.getMetrics());
  const [lastStep, setLastStep] = useState<SimStep | undefined>();
  const [recentSteps, setRecentSteps] = useState<SimStep[]>([]);
  const [history, setHistory] = useState<SimStep[]>([]);

  // Modals
  const [showAutoAnalyze, setShowAutoAnalyze] = useState<boolean>(false);
  const [showReport, setShowReport] = useState<boolean>(false);

  // Active Bottom Tab
  const [bottomTab, setBottomTab] = useState<"charts" | "pipeline" | "debugger" | "handcheck">("charts");

  // Active Center Stage View ("motherboard" | "cache" | "player")
  const [centerStage, setCenterStage] = useState<"motherboard" | "cache" | "player">("motherboard");

  // Simulation Ticker: Calmed down to a steady, explainable pace (1-2 accesses/sec on 1x)
  useEffect(() => {
    if (!isRunning || isRaceMode) return;

    // Calm step count and readable interval (e.g., 500ms at 1x speed)
    const stepCount = speed >= 2 ? Math.round(2 * (speed / 2)) : 1;
    const intervalTime = Math.max(100, Math.round(500 / speed));

    const interval = setInterval(() => {
      const steps = simRef.current.step(stepCount);
      if (steps.length > 0) {
        const latest = steps[steps.length - 1];
        setLastStep(latest);
        setRecentSteps((prev) => [...prev.slice(-16), ...steps]);
        setHistory([...simRef.current.history]);
      }
      setMetrics({ ...simRef.current.getMetrics() });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isRunning, speed, isRaceMode]);

  // Handle configuration changes
  const handleConfigChange = (partial: Partial<SimConfig>) => {
    const updated = { ...config, ...partial };
    setConfig(updated);
    simRef.current.setConfig(partial);
    setMetrics({ ...simRef.current.getMetrics() });
  };

  // Step 1 Cycle
  const handleStep = () => {
    const steps = simRef.current.step(1);
    if (steps.length > 0) {
      setLastStep(steps[0]);
      setRecentSteps((prev) => [...prev.slice(-20), ...steps]);
      setHistory([...simRef.current.history]);
    }
    setMetrics({ ...simRef.current.getMetrics() });
  };

  // Reset Simulation
  const handleReset = () => {
    simRef.current.reset();
    setMetrics({ ...simRef.current.getMetrics() });
    setRecentSteps([]);
    setLastStep(undefined);
    setHistory([]);
  };

  // Preset Selection
  const handleSelectPreset = (presetName: string) => {
    setActivePreset(presetName);
    if (presetName === "balanced") {
      handleConfigChange({
        quality: "1080p",
        cacheSizeKB: 16,
        blockSizeB: 64,
        transferMode: "DMA",
        accessPattern: "sequential",
      });
    } else if (presetName === "phone") {
      handleConfigChange({
        quality: "480p",
        cacheSizeKB: 8,
        blockSizeB: 32,
        transferMode: "DMA",
        accessPattern: "sequential",
      });
    } else if (presetName === "weak_4k") {
      handleConfigChange({
        quality: "480p",
        cacheSizeKB: 4,
        blockSizeB: 16,
        transferMode: "CPU",
        accessPattern: "sequential",
      });
    } else if (presetName === "scrubbing") {
      handleConfigChange({
        quality: "1080p",
        cacheSizeKB: 16,
        blockSizeB: 128,
        transferMode: "DMA",
        accessPattern: "seeking",
        seekFrequency: 0.5,
      });
    }
  };

  // Apply best configuration from Auto-Analyze sweep
  const handleApplyBestConfig = (best: { blockSizeB: any; transferMode: any }) => {
    handleConfigChange({
      blockSizeB: best.blockSizeB,
      transferMode: best.transferMode,
    });
  };

  return (
    <div className="min-h-screen bg-[#F5F2EB] flex flex-col">
      {/* Top Controls Header */}
      <LabHeader
        isRunning={isRunning}
        onTogglePlay={() => setIsRunning(!isRunning)}
        onStep={handleStep}
        onReset={handleReset}
        speed={speed}
        onChangeSpeed={setSpeed}
        activePreset={activePreset}
        onSelectPreset={handleSelectPreset}
        onOpenAutoAnalyze={() => setShowAutoAnalyze(true)}
        onOpenReport={() => setShowReport(true)}
        isRaceMode={isRaceMode}
        onToggleRaceMode={() => setIsRaceMode(!isRaceMode)}
      />

      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-6 space-y-6 flex-1">
        {isRaceMode ? (
          /* Race Mode View */
          <RaceMode baseConfig={config} />
        ) : (
          /* Standard 3-Column Lab View */
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Hardware Controls (3 cols) */}
              <div className="lg:col-span-3 space-y-4">
                <Controls
                  config={config}
                  onChangeConfig={handleConfigChange}
                  onResetDefaults={() => handleConfigChange(DEFAULT_CONFIG)}
                />
              </div>

              {/* Center Column: Focused Simulation Stage (6 cols) */}
              <div className="lg:col-span-6 space-y-4">
                {/* Stage Selector Pills */}
                <div className="flex items-center justify-between bg-[#FFFFFF] border-2 border-[#12151A] p-1.5 rounded-lg shadow-[3px_3px_0_#12151A]">
                  <div className="flex items-center gap-1 font-mono text-xs">
                    <button
                      onClick={() => setCenterStage("motherboard")}
                      className={`px-3 py-1.5 rounded font-bold transition-all ${
                        centerStage === "motherboard"
                          ? "bg-[#12151A] text-[#CCFF00] shadow-[2px_2px_0_#12151A]"
                          : "text-[#5A6372] hover:text-[#12151A]"
                      }`}
                    >
                      🏙️ 3D Motherboard
                    </button>

                    <button
                      onClick={() => setCenterStage("cache")}
                      className={`px-3 py-1.5 rounded font-bold transition-all ${
                        centerStage === "cache"
                          ? "bg-[#12151A] text-[#CCFF00] shadow-[2px_2px_0_#12151A]"
                          : "text-[#5A6372] hover:text-[#12151A]"
                      }`}
                    >
                      🔬 Cache Bit Inspector
                    </button>

                    <button
                      onClick={() => setCenterStage("player")}
                      className={`px-3 py-1.5 rounded font-bold transition-all ${
                        centerStage === "player"
                          ? "bg-[#12151A] text-[#CCFF00] shadow-[2px_2px_0_#12151A]"
                          : "text-[#5A6372] hover:text-[#12151A]"
                      }`}
                    >
                      📺 Video Monitor
                    </button>
                  </div>

                  {/* Calm persistent mini-status */}
                  <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-[#5A6372] pr-2">
                    <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse"></span>
                    <span>ADDR: <strong className="text-[#12151A]">{lastStep ? lastStep.hexAddress : "0x20000000"}</strong></span>
                  </div>
                </div>

                {/* Active Focused Visual Stage */}
                {centerStage === "motherboard" && (
                  <Motherboard3D
                    transferMode={config.transferMode}
                    isBuffering={metrics.isBuffering}
                    cpuUtilizationFree={metrics.cpuUtilizationFree}
                    hitRatio={metrics.hitRatio}
                    currentAddressHex={lastStep?.hexAddress}
                  />
                )}

                {centerStage === "cache" && (
                  <CacheVisualizer
                    cache={simRef.current.cache}
                    lastStep={lastStep}
                    recentSteps={recentSteps}
                  />
                )}

                {centerStage === "player" && (
                  <PlayerSim
                    quality={config.quality}
                    transferMode={config.transferMode}
                    bufferLevelPct={metrics.bufferLevelPct}
                    isBuffering={metrics.isBuffering}
                    fps={metrics.fps}
                    frameCounter={metrics.frameCounter}
                  />
                )}
              </div>

              {/* Right Column: Live Telemetry & Stress Deck (3 cols) */}
              <div className="lg:col-span-3 space-y-6">
                <MetricsPanel metrics={metrics} config={config} />

                {/* Break-It Stress Test Deck */}
                <BreakItDeck
                  onSeekStorm={() => simRef.current.triggerSeekStorm()}
                  onColdFlush={() => simRef.current.triggerColdFlush()}
                  onNetworkBurst={() => simRef.current.triggerNetworkBurst()}
                />
              </div>
            </div>

            {/* Bottom Analysis Tabs Deck */}
            <div className="space-y-3 pt-2">
              {/* Tab Navigation */}
              <div className="flex flex-wrap items-center gap-2 border-b-2 border-[#12151A] pb-2">
                <button
                  onClick={() => setBottomTab("charts")}
                  className={`px-3 py-1.5 rounded font-mono text-xs font-bold border-2 border-[#12151A] flex items-center gap-1.5 transition-all ${
                    bottomTab === "charts"
                      ? "bg-[#CCFF00] text-[#12151A] shadow-[3px_3px_0_#12151A]"
                      : "bg-[#FFFFFF] text-[#5A6372] hover:text-[#12151A]"
                  }`}
                >
                  <TrendingUp size={15} />
                  <span>U-Shaped AMAT & Performance Charts</span>
                </button>

                <button
                  onClick={() => setBottomTab("pipeline")}
                  className={`px-3 py-1.5 rounded font-mono text-xs font-bold border-2 border-[#12151A] flex items-center gap-1.5 transition-all ${
                    bottomTab === "pipeline"
                      ? "bg-[#CCFF00] text-[#12151A] shadow-[3px_3px_0_#12151A]"
                      : "bg-[#FFFFFF] text-[#5A6372] hover:text-[#12151A]"
                  }`}
                >
                  <GitCommit size={15} />
                  <span>5-Stage Instruction Pipeline (CO6)</span>
                </button>

                <button
                  onClick={() => setBottomTab("debugger")}
                  className={`px-3 py-1.5 rounded font-mono text-xs font-bold border-2 border-[#12151A] flex items-center gap-1.5 transition-all ${
                    bottomTab === "debugger"
                      ? "bg-[#CCFF00] text-[#12151A] shadow-[3px_3px_0_#12151A]"
                      : "bg-[#FFFFFF] text-[#5A6372] hover:text-[#12151A]"
                  }`}
                >
                  <History size={15} />
                  <span>Rewind Cycle Debugger</span>
                </button>

                <button
                  onClick={() => setBottomTab("handcheck")}
                  className={`px-3 py-1.5 rounded font-mono text-xs font-bold border-2 border-[#12151A] flex items-center gap-1.5 transition-all ${
                    bottomTab === "handcheck"
                      ? "bg-[#CCFF00] text-[#12151A] shadow-[3px_3px_0_#12151A]"
                      : "bg-[#FFFFFF] text-[#5A6372] hover:text-[#12151A]"
                  }`}
                >
                  <Calculator size={15} />
                  <span>Viva Hand-Check Formulas</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div>
                {bottomTab === "charts" && <ChartsView currentConfig={config} />}
                {bottomTab === "pipeline" && (
                  <PipelineView
                    missRatio={metrics.missRatio}
                    missPenalty={metrics.missPenalty}
                  />
                )}
                {bottomTab === "debugger" && (
                  <RewindDebugger
                    history={history}
                    geometry={simRef.current.cache.geometry}
                  />
                )}
                {bottomTab === "handcheck" && (
                  <HandCheckPanel config={config} metrics={metrics} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AutoAnalyzeModal
        isOpen={showAutoAnalyze}
        onClose={() => setShowAutoAnalyze(false)}
        currentConfig={config}
        onApplyBestConfig={handleApplyBestConfig}
      />

      <FacultyReport
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        config={config}
        metrics={metrics}
      />
    </div>
  );
};
