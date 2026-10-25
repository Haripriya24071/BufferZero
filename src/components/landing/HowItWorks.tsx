import React, { useState } from "react";
import { Sliders, PlayCircle, BarChart3, Sparkles, RefreshCcw } from "lucide-react";

export const HowItWorks: React.FC = () => {
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
      title: "Auto-Analyze",
      desc: "Let the parameter sweep test all configurations in a Web Worker, locate the U-curve sweet spot, and apply optimal settings with 1 click.",
      icon: Sparkles,
    },
  ];

  const totalAccesses = toyStats.hits + toyStats.misses;
  const toyHitRatio = totalAccesses > 0 ? Math.round((toyStats.hits / totalAccesses) * 100) : 0;

  return (
    <section id="how-it-works" className="py-20 md:py-28 px-4 md:px-8 bg-[#FAF8F5] border-b-2 border-[#12151A]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="font-mono text-xs uppercase tracking-widest text-[#12151A] font-bold px-3 py-1 bg-[#CCFF00] border border-[#12151A] rounded inline-block shadow-[2px_2px_0_#12151A]">
            Interactive Workflow
          </span>
          <h2 className="font-display text-4xl sm:text-5xl text-[#12151A] mt-3 tracking-tight">
            Four Steps to Hardware Mastery
          </h2>
          <p className="text-[#5A6372] mt-3 text-sm sm:text-base">
            From adjusting raw silicon bus parameters to exporting a faculty-ready viva defense report.
          </p>
        </div>

        {/* 4 Stepper Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="bg-[#FFFFFF] border-2 border-[#12151A] p-6 rounded-lg shadow-[4px_4px_0_#12151A] hover:-translate-y-2 hover:shadow-[6px_6px_0_#12151A] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-display text-4xl text-[#CCFF00] drop-shadow-[2px_2px_0_#12151A]">
                      {s.num}
                    </span>
                    <div className="w-10 h-10 rounded-md bg-[#F5F2EB] border border-[#12151A] flex items-center justify-center">
                      <Icon size={18} className="text-[#12151A]" />
                    </div>
                  </div>
                  <h3 className="font-display text-xl text-[#12151A] mb-2">{s.title}</h3>
                  <p className="text-xs sm:text-sm text-[#5A6372] leading-relaxed">{s.desc}</p>
                </div>

                <div className="mt-6 pt-3 border-t border-[#12151A]/10 flex items-center gap-1.5 font-mono text-[10px] text-[#12151A] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#12151A]"></span>
                  <span>Step {s.num} of 4</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Cache Toy */}
        <div className="bg-[#FFFFFF] border-3 border-[#12151A] p-6 md:p-8 rounded-xl shadow-[8px_8px_0_#12151A] max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-[#12151A]/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#CCFF00] border border-[#12151A] rounded-full"></span>
                <h4 className="font-display text-lg text-[#12151A]">Interactive Cache Toy</h4>
              </div>
              <p className="text-xs font-mono text-[#5A6372] mt-0.5">
                Click any line block to simulate memory lookup behavior (Hit vs Miss)
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="font-mono text-xs flex items-center gap-3">
                <span className="text-[#12151A]">
                  Hits: <strong className="text-[#12151A] bg-[#CCFF00] px-1.5 py-0.5 rounded border border-[#12151A]">{toyStats.hits}</strong>
                </span>
                <span className="text-[#12151A]">
                  Misses: <strong className="text-white bg-[#FF3B30] px-1.5 py-0.5 rounded border border-[#12151A]">{toyStats.misses}</strong>
                </span>
                <span className="text-[#12151A] font-bold">
                  Ratio: {toyHitRatio}%
                </span>
              </div>

              <button
                onClick={handleResetToy}
                className="p-1.5 bg-[#F5F2EB] hover:bg-[#EAE5DB] border border-[#12151A] rounded text-[#12151A] transition-colors"
                title="Reset Cache Toy"
              >
                <RefreshCcw size={14} />
              </button>
            </div>
          </div>

          {/* 8 Blocks Row */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-4">
            {toyBlocks.map((block, idx) => (
              <button
                key={block.id}
                onClick={() => handleBlockClick(idx)}
                className={`h-20 rounded-md border-2 border-[#12151A] flex flex-col items-center justify-between p-2 cursor-pointer transition-all transform active:scale-95 ${
                  block.status === "hit"
                    ? "bg-[#CCFF00] shadow-[3px_3px_0_#12151A]"
                    : block.status === "miss"
                    ? "bg-[#FF3B30] text-white shadow-[3px_3px_0_#12151A]"
                    : "bg-[#F5F2EB] hover:bg-[#EAE5DB] shadow-[2px_2px_0_#12151A]"
                }`}
              >
                <span className="font-mono text-[10px] font-bold opacity-75">
                  Line {block.id}
                </span>

                <div className="font-mono text-xs font-extrabold uppercase">
                  {block.status === "empty" ? "Empty" : block.status === "hit" ? "HIT" : "MISS"}
                </div>

                <span className="font-mono text-[9px] opacity-70">
                  Tag 0x{block.tag.toString(16).toUpperCase()}
                </span>
              </button>
            ))}
          </div>

          {/* Running Status Feed */}
          <div className="bg-[#12151A] text-[#CCFF00] font-mono text-xs p-3 rounded border border-[#12151A] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-ping"></span>
              <span>{toyStats.lastAction}</span>
            </div>
            <span className="text-[10px] text-[#8E99A8] hidden sm:inline">Click cached block to trigger HIT</span>
          </div>
        </div>
      </div>
    </section>
  );
};
