import React, { useState, useMemo } from "react";
import {
  Sliders,
  PlayCircle,
  BarChart3,
  RefreshCcw,
  TrendingUp,
  GitCommit,
  History,
  Calculator,
} from "lucide-react";
import { ChartsView } from "../lab/ChartsView";
import { PipelineView } from "../lab/PipelineView";
import { RewindDebugger } from "../lab/RewindDebugger";
import { HandCheckPanel } from "../lab/HandCheckPanel";
import { Simulation, DEFAULT_CONFIG } from "../../engine/simulation";

export const HowItWorks: React.FC = () => {
  // Active bottom analysis tab for live preview
  const [analysisTab, setAnalysisTab] = useState<"charts" | "pipeline" | "debugger" | "handcheck">("charts");

  // Sample simulation for live interactive charts & pipeline preview on landing page
  const landingSim = useMemo(() => {
    const sim = new Simulation(DEFAULT_CONFIG);
    for (let i = 0; i < 28; i++) {
      sim.step();
    }
    return sim;
  }, []);

  const landingMetrics = landingSim.getMetrics();

  // Interactive 8-block Cache Toy state
  const [toyBlocks, setToyBlocks] = useState<Array<{ id: number; tag: number; status: "empty" | "hit" | "miss" }>>([
    { id: 0, tag: 0x1A, status: "empty" },
    { id: 1, tag: 0x1B, status: "empty" },
    { id: 2, tag: 0x2A, status: "empty" },
    { id: 3, tag: 0x3C, status: "empty" },
    { id: 4, tag: 0x4D, status: "empty" },
    { id: 5, tag: 0x5E, status: "empty" },
    { id: 6, tag: 0x6F, status: "empty" },
    { id: 7, tag: 0x70, status: "empty" },
  ]);

  const [toyStats, setToyStats] = useState<{ hits: number; misses: number; lastAction: string }>({
    hits: 0,
    misses: 0,
    lastAction: "Click any memory block below to simulate a hardware cache access!",
  });

  const handleBlockClick = (index: number) => {
    setToyBlocks((prev) => {
      const next = [...prev];
      const block = next[index];

      // If already cached, it's a HIT!
      if (block.status === "hit") {
        setToyStats((s) => ({
          ...s,
          hits: s.hits + 1,
          lastAction: `Block #${index} [Tag 0x${block.tag.toString(16).toUpperCase()}] HIT in cache! Serviced in 1 cycle.`,
        }));
        return next;
      }

      // If empty or miss, simulate miss followed by cache fill
      const isMiss = block.status === "empty";
      block.status = isMiss ? "miss" : "hit";

      setToyStats((s) => ({
        ...s,
        misses: isMiss ? s.misses + 1 : s.misses,
        hits: !isMiss ? s.hits + 1 : s.hits,
        lastAction: isMiss
          ? `Block #${index} MISSED! Fetched from DRAM (+112 cycles). Block is now cached.`
          : `Block #${index} HIT in cache!`,
      }));

      // Turn into cached hit line after brief visual delay
      if (isMiss) {
        setTimeout(() => {
          setToyBlocks((curr) => {
            const updated = [...curr];
            updated[index].status = "hit";
            return updated;
          });
        }, 300);
      }

      return next;
    });
  };

  const handleResetToy = () => {
    setToyBlocks(toyBlocks.map((b) => ({ ...b, status: "empty" })));
    setToyStats({
      hits: 0,
      misses: 0,
      lastAction: "Cache cleared. Click any memory block to begin.",
    });
  };

  const steps = [
    {
      num: "1",
      title: "Configure",
      desc: "Select cache size, block size (16B–256B), associativity, CPU vs DMA transfer mode, and stream quality (480p to 4K).",
      icon: Sliders,
    },
    {
      num: "2",
      title: "Simulate",
      desc: "Watch live 32-bit memory addresses decompose into Tag | Index | Offset and flow across bus conduits into the cache bank.",
      icon: PlayCircle,
    },
    {
      num: "3",
      title: "Read Results",
      desc: "Inspect real-time Hit Ratio, AMAT (cycles), CPI, CPU Utilization Free %, and the live video player buffer stability tube.",
      icon: BarChart3,
    },
    {
      num: "4",
      title: "Analyze Curves",
      desc: "Inspect empirical U-curve trade-offs across block sizes (16B–256B), pipeline stalls, and DMA hardware efficiency.",
      icon: TrendingUp,
    },
  ];

  const totalAccesses = toyStats.hits + toyStats.misses;
  const toyHitRatio = totalAccesses > 0 ? Math.round((toyStats.hits / totalAccesses) * 100) : 0;

  return (
    <section id="how-it-works" className="py-20 md:py-28 px-4 md:px-8 bg-[#FFFFFF] border-b-2 border-[#171717]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="font-mono text-xs uppercase tracking-widest text-[#171717] font-bold px-3 py-1 bg-[#D7FF38] border border-[#171717] rounded inline-block shadow-[2px_2px_0_#171717]">
            Interactive Workflow
          </span>
          <h2 className="font-display text-4xl sm:text-5xl text-[#171717] mt-3 tracking-tight">
            Four Steps to Hardware Mastery
          </h2>
          <p className="text-[#5A6372] mt-3 text-sm sm:text-base">
            From adjusting raw silicon bus parameters to evaluating high-fidelity memory hierarchy and streaming telemetry.
          </p>
        </div>

        {/* 4 Stepper Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="bg-[#FFFFFF] border-2 border-[#171717] p-6 rounded-lg shadow-[4px_4px_0_#171717] hover:-translate-y-2 hover:shadow-[6px_6px_0_#171717] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-display text-4xl text-[#D7FF38] drop-shadow-[2px_2px_0_#171717]">
                      {s.num}
                    </span>
                    <div className="w-10 h-10 rounded-md bg-[#F5F5F0] border border-[#171717] flex items-center justify-center">
                      <Icon size={18} className="text-[#171717]" />
                    </div>
                  </div>
                  <h3 className="font-display text-xl text-[#171717] mb-2">{s.title}</h3>
                  <p className="text-xs sm:text-sm text-[#5A6372] leading-relaxed">{s.desc}</p>
                </div>

                <div className="mt-6 pt-3 border-t border-[#171717]/10 flex items-center gap-1.5 font-mono text-[10px] text-[#171717] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#171717]"></span>
                  <span>Step {s.num} of 4</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Architecture Analysis Suite (Live Analytical Engine - Yellow Backdrop) */}
        <div className="mb-16 p-6 sm:p-8 rounded-2xl bg-[#D7FF38] border-3 border-[#171717] shadow-[8px_8px_0_#171717] space-y-6 text-[#171717]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b-2 border-[#171717]">
            <div>
              <span className="font-mono text-xs uppercase tracking-widest text-[#D7FF38] font-black px-3 py-1 bg-[#171717] rounded-md inline-block shadow-[2px_2px_0_#2457FF]">
                Live Analytical Engine
              </span>
              <h3 className="font-display text-2xl sm:text-3xl text-[#171717] font-black mt-2 tracking-tight">
                Hardware Performance Analysis & AMAT Curves
              </h3>
            </div>
            <span className="font-mono text-xs font-bold text-[#171717] bg-[#FFFFFF] px-3 py-1.5 rounded-lg border-2 border-[#171717] shadow-[2px_2px_0_#171717]">
              Interactive Simulation Engine
            </span>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setAnalysisTab("charts")}
              className={`px-3.5 py-2 rounded-lg font-mono text-xs font-bold border-2 border-[#171717] flex items-center gap-1.5 transition-all cursor-pointer ${
                analysisTab === "charts"
                  ? "bg-[#171717] text-[#D7FF38] shadow-[3px_3px_0_#2457FF]"
                  : "bg-[#FFFFFF] text-[#171717] hover:bg-[#F5F5F0] shadow-[2px_2px_0_#171717]"
              }`}
            >
              <TrendingUp size={15} />
              <span>U-Shaped AMAT & Performance Charts</span>
            </button>

            <button
              onClick={() => setAnalysisTab("pipeline")}
              className={`px-3.5 py-2 rounded-lg font-mono text-xs font-bold border-2 border-[#171717] flex items-center gap-1.5 transition-all cursor-pointer ${
                analysisTab === "pipeline"
                  ? "bg-[#171717] text-[#D7FF38] shadow-[3px_3px_0_#2457FF]"
                  : "bg-[#FFFFFF] text-[#171717] hover:bg-[#F5F5F0] shadow-[2px_2px_0_#171717]"
              }`}
            >
              <GitCommit size={15} />
              <span>5-Stage Instruction Pipeline (CO6)</span>
            </button>

            <button
              onClick={() => setAnalysisTab("debugger")}
              className={`px-3.5 py-2 rounded-lg font-mono text-xs font-bold border-2 border-[#171717] flex items-center gap-1.5 transition-all cursor-pointer ${
                analysisTab === "debugger"
                  ? "bg-[#171717] text-[#D7FF38] shadow-[3px_3px_0_#2457FF]"
                  : "bg-[#FFFFFF] text-[#171717] hover:bg-[#F5F5F0] shadow-[2px_2px_0_#171717]"
              }`}
            >
              <History size={15} />
              <span>Rewind Cycle Debugger</span>
            </button>

            <button
              onClick={() => setAnalysisTab("handcheck")}
              className={`px-3.5 py-2 rounded-lg font-mono text-xs font-bold border-2 border-[#171717] flex items-center gap-1.5 transition-all cursor-pointer ${
                analysisTab === "handcheck"
                  ? "bg-[#171717] text-[#D7FF38] shadow-[3px_3px_0_#2457FF]"
                  : "bg-[#FFFFFF] text-[#171717] hover:bg-[#F5F5F0] shadow-[2px_2px_0_#171717]"
              }`}
            >
              <Calculator size={15} />
              <span>Architecture Formula Verifier (CO5 / CO6)</span>
            </button>
          </div>

          {/* Tab Contents */}
          <div className="bg-[#FFFFFF] border-2 border-[#171717] rounded-xl shadow-[4px_4px_0_#171717] p-2 overflow-hidden">
            {analysisTab === "charts" && <ChartsView currentConfig={DEFAULT_CONFIG} />}
            {analysisTab === "pipeline" && (
              <PipelineView
                missRatio={landingMetrics.missRatio}
                missPenalty={landingMetrics.missPenalty}
              />
            )}
            {analysisTab === "debugger" && (
              <RewindDebugger
                history={landingSim.history}
                geometry={landingSim.cache.geometry}
              />
            )}
            {analysisTab === "handcheck" && (
              <HandCheckPanel config={DEFAULT_CONFIG} metrics={landingMetrics} />
            )}
          </div>
        </div>

        {/* Interactive Cache Toy */}
        <div className="bg-[#FFFFFF] border-3 border-[#171717] p-6 md:p-8 rounded-xl shadow-[8px_8px_0_#171717] max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-[#171717]/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#D7FF38] border border-[#171717] rounded-full"></span>
                <h4 className="font-display text-lg text-[#171717]">Interactive Cache Toy</h4>
              </div>
              <p className="text-xs font-mono text-[#5A6372] mt-0.5">
                Click any line block to simulate memory lookup behavior (Hit vs Miss)
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="font-mono text-xs flex items-center gap-3">
                <span className="text-[#171717]">
                  Hits: <strong className="text-[#171717] bg-[#D7FF38] px-1.5 py-0.5 rounded border border-[#171717]">{toyStats.hits}</strong>
                </span>
                <span className="text-[#171717]">
                  Misses: <strong className="text-white bg-[#FF3B30] px-1.5 py-0.5 rounded border border-[#171717]">{toyStats.misses}</strong>
                </span>
                <span className="text-[#171717] font-bold">
                  Ratio: {toyHitRatio}%
                </span>
              </div>

              <button
                onClick={handleResetToy}
                className="p-1.5 bg-[#F5F5F0] hover:bg-[#EBEBE6] border border-[#171717] rounded text-[#171717] transition-colors"
                title="Reset Cache Toy"
              >
                <RefreshCcw size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-6">
            {toyBlocks.map((b, idx) => (
              <button
                key={b.id}
                onClick={() => handleBlockClick(idx)}
                className={`h-20 rounded-lg border-2 border-[#171717] font-mono flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-[3px_3px_0_#171717] active:translate-y-0.5 ${
                  b.status === "hit"
                    ? "bg-[#D7FF38] text-[#171717]"
                    : b.status === "miss"
                    ? "bg-[#FF3B30] text-white"
                    : "bg-[#F5F5F0] hover:bg-[#EBEBE6] text-[#5A6372]"
                }`}
              >
                <span className="text-[10px] opacity-75">#{b.id}</span>
                <span className="text-xs font-bold">0x{b.tag.toString(16).toUpperCase()}</span>
                <span className="text-[9px] uppercase font-bold tracking-wider">
                  {b.status}
                </span>
              </button>
            ))}
          </div>

          <div className="p-3 bg-[#171717] text-white rounded font-mono text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D7FF38] animate-pulse"></span>
              <span className="text-[#EBEBE6]">{toyStats.lastAction}</span>
            </div>
            <span className="text-[10px] text-[#A3A3A3] hidden sm:inline">LRU Replacement</span>
          </div>
        </div>
      </div>
    </section>
  );
};
