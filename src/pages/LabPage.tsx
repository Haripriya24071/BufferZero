import React, { useState, useEffect, useRef } from "react";
import { Simulation, DEFAULT_CONFIG } from "../engine/simulation";
import { SimConfig, SimMetrics, SimStep } from "../engine/types";
import { LabHeader } from "../components/lab/LabHeader";
import { Controls } from "../components/lab/Controls";
import { Motherboard3D } from "../components/lab/Motherboard3D";
import { RaceMode } from "../components/lab/RaceMode";

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
        quality: "4K",
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
      {/* Top Controls Header: Transport on left, Race Mode on far right corner */}
      <LabHeader
        isRunning={isRunning}
        onTogglePlay={() => setIsRunning(!isRunning)}
        onStep={handleStep}
        onReset={handleReset}
        speed={speed}
        onChangeSpeed={setSpeed}
        isRaceMode={isRaceMode}
        onToggleRaceMode={() => setIsRaceMode(!isRaceMode)}
      />

      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-6 space-y-6 flex-1">
        {isRaceMode ? (
          /* Race Mode View */
          <RaceMode baseConfig={config} />
        ) : (
          /* Balanced 2-Column Lab Workspace (4 cols : 8 cols) */
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Architecture Controls + Workload Presets + Stress Knobs (4 cols) */}
              <div className="lg:col-span-4 space-y-4">
                <Controls
                  config={config}
                  onChangeConfig={handleConfigChange}
                  onResetDefaults={() => handleConfigChange(DEFAULT_CONFIG)}
                  onSeekStorm={() => simRef.current.triggerSeekStorm()}
                  onColdFlush={() => simRef.current.triggerColdFlush()}
                  onNetworkBurst={() => simRef.current.triggerNetworkBurst()}
                  activePreset={activePreset}
                  onSelectPreset={handleSelectPreset}
                  isRaceMode={isRaceMode}
                  onToggleRaceMode={() => setIsRaceMode(!isRaceMode)}
                />
              </div>

              {/* Right Column: Custom 3D Architecture Motherboard Simulator (8 cols) */}
              <div className="lg:col-span-8">
                <Motherboard3D
                  transferMode={config.transferMode}
                  isBuffering={metrics.isBuffering}
                  cpuUtilizationFree={metrics.cpuUtilizationFree}
                  hitRatio={metrics.hitRatio}
                  currentAddressHex={lastStep?.hexAddress}
                  lastStep={lastStep}
                  blockSizeB={config.blockSizeB}
                  cacheSizeKB={config.cacheSizeKB}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
