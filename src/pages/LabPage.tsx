import React, { useState, useEffect, useRef } from "react";
import { Simulation, DEFAULT_CONFIG } from "../engine/simulation";
import { SimConfig, SimMetrics, SimStep } from "../engine/types";
import { LabHeader } from "../components/lab/LabHeader";
import { Controls } from "../components/lab/Controls";
import { Motherboard3D } from "../components/lab/Motherboard3D";
import { CacheVisualizer } from "../components/lab/CacheVisualizer";
import { MetricsPanel } from "../components/lab/MetricsPanel";
import { TelemetryHUD } from "../components/lab/TelemetryHUD";
import { RaceMode } from "../components/lab/RaceMode";
import { RewindDebugger } from "../components/lab/RewindDebugger";
import { BreakItDeck } from "../components/lab/BreakItDeck";
import { HandCheckPanel } from "../components/lab/HandCheckPanel";
import { ChartsView } from "../components/lab/ChartsView";
import { PipelineView } from "../components/lab/PipelineView";
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

  // Active Bottom Tab
  const [bottomTab, setBottomTab] = useState<"charts" | "pipeline" | "debugger" | "handcheck">("charts");

  // Active Center Stage View ("motherboard" | "cache")
  const [centerStage, setCenterStage] = useState<"motherboard" | "cache">("motherboard");

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

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col">
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
        isRaceMode={isRaceMode}
        onToggleRaceMode={() => setIsRaceMode(!isRaceMode)}
      />

      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-6 space-y-6 flex-1">
        {/* Top Cockpit: Primary Live Telemetry HUD */}
        <TelemetryHUD metrics={metrics} config={config} />

        {isRaceMode ? (
          /* Race Mode View */
          <RaceMode baseConfig={config} />
        ) : (
          /* Balanced 2-Column Lab Workspace (5 cols : 7 cols) */
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Architecture Controls + Stress Knobs (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <Controls
                  config={config}
                  onChangeConfig={handleConfigChange}
                  onResetDefaults={() => handleConfigChange(DEFAULT_CONFIG)}
                  onSeekStorm={() => simRef.current.triggerSeekStorm()}
                  onColdFlush={() => simRef.current.triggerColdFlush()}
                  onNetworkBurst={() => simRef.current.triggerNetworkBurst()}
                />
              </div>

              {/* Right Column: Visual Stage & Hardware Logic Explainer (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {/* Stage Selector Pills */}
                <div className="flex items-center justify-between bg-[#FFFFFF] border-2 border-[#171717] p-1.5 rounded-lg shadow-[3px_3px_0_#171717]">
                  <div className="flex items-center gap-1 font-mono text-xs">
                    <button
                      onClick={() => setCenterStage("motherboard")}
                      className={`px-3 py-1.5 rounded font-bold transition-all cursor-pointer ${
                        centerStage === "motherboard"
                          ? "bg-[#171717] text-[#D7FF38] shadow-[2px_2px_0_#2457FF]"
                          : "text-[#525252] hover:text-[#171717]"
                      }`}
                    >
                      🏙️ 3D Motherboard
                    </button>

                    <button
                      onClick={() => setCenterStage("cache")}
                      className={`px-3 py-1.5 rounded font-bold transition-all cursor-pointer ${
                        centerStage === "cache"
                          ? "bg-[#171717] text-[#D7FF38] shadow-[2px_2px_0_#2457FF]"
                          : "text-[#525252] hover:text-[#171717]"
                      }`}
                    >
                      🔬 Cache Bit Inspector
                    </button>
                  </div>

                  {/* Calm persistent mini-status */}
                  <div className="hidden sm:flex items-center gap-2 font-mono text-[10px] text-[#525252] pr-2">
                    <span className="w-2 h-2 rounded-full bg-[#2457FF] animate-pulse"></span>
                    <span>ADDR: <strong className="text-[#171717]">{lastStep ? lastStep.hexAddress : "0x20000000"}</strong></span>
                  </div>
                </div>

                {/* Active Focused Visual Stage */}
                <div className="flex flex-col">
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
                </div>

                {/* Hardware Logic Explainer & Secondary Telemetry */}
                <MetricsPanel metrics={metrics} config={config} />
              </div>
            </div>

            {/* Bottom Analysis Tabs Deck */}
            <div className="space-y-3 pt-2">
              {/* Tab Navigation */}
              <div className="flex flex-wrap items-center gap-2 border-b-2 border-[#171717] pb-2">
                <button
                  onClick={() => setBottomTab("charts")}
                  className={`px-3 py-1.5 rounded font-mono text-xs font-bold border-2 border-[#171717] flex items-center gap-1.5 transition-all cursor-pointer ${
                    bottomTab === "charts"
                      ? "bg-[#2457FF] text-white shadow-[3px_3px_0_#171717]"
                      : "bg-[#FFFFFF] text-[#525252] hover:text-[#171717]"
                  }`}
                >
                  <TrendingUp size={15} />
                  <span>U-Shaped AMAT & Performance Charts</span>
                </button>

                <button
                  onClick={() => setBottomTab("pipeline")}
                  className={`px-3 py-1.5 rounded font-mono text-xs font-bold border-2 border-[#171717] flex items-center gap-1.5 transition-all cursor-pointer ${
                    bottomTab === "pipeline"
                      ? "bg-[#2457FF] text-white shadow-[3px_3px_0_#171717]"
                      : "bg-[#FFFFFF] text-[#525252] hover:text-[#171717]"
                  }`}
                >
                  <GitCommit size={15} />
                  <span>5-Stage Instruction Pipeline (CO6)</span>
                </button>

                <button
                  onClick={() => setBottomTab("debugger")}
                  className={`px-3 py-1.5 rounded font-mono text-xs font-bold border-2 border-[#171717] flex items-center gap-1.5 transition-all cursor-pointer ${
                    bottomTab === "debugger"
                      ? "bg-[#2457FF] text-white shadow-[3px_3px_0_#171717]"
                      : "bg-[#FFFFFF] text-[#525252] hover:text-[#171717]"
                  }`}
                >
                  <History size={15} />
                  <span>Rewind Cycle Debugger</span>
                </button>

                <button
                  onClick={() => setBottomTab("handcheck")}
                  className={`px-3 py-1.5 rounded font-mono text-xs font-bold border-2 border-[#171717] flex items-center gap-1.5 transition-all cursor-pointer ${
                    bottomTab === "handcheck"
                      ? "bg-[#2457FF] text-white shadow-[3px_3px_0_#171717]"
                      : "bg-[#FFFFFF] text-[#525252] hover:text-[#171717]"
                  }`}
                >
                  <Calculator size={15} />
                  <span>Architecture Formula Verifier (CO5 / CO6)</span>
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
    </div>
  );
};
