import React, { useState, useEffect } from "react";
import { Zap, ArrowDown, Activity, Cpu, Layers, Disc3 } from "lucide-react";

interface HeroProps {
  onLaunchLab: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onLaunchLab }) => {
  // Live dynamic values for the floating cards
  const [hitRatio, setHitRatio] = useState<number>(92.4);
  const [cells, setCells] = useState<boolean[]>([
    true, true, true, false, true, true, true, true, false, true, true, true,
  ]);
  const [amat, setAmat] = useState<number>(4.2);
  const [bufferLevel, setBufferLevel] = useState<number>(78);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [blockSizeIndex, setBlockSizeIndex] = useState<number>(2); // 64B

  const blockSizes = ["16B", "32B", "64B", "128B", "256B"];

  useEffect(() => {
    const interval = setInterval(() => {
      // Subtle organic oscillations to keep cards lively
      setHitRatio((prev) => {
        const next = prev + (Math.random() * 1.6 - 0.8);
        return Math.min(96, Math.max(88, Math.round(next * 10) / 10));
      });

      setCells((prev) => {
        const next = [...prev];
        const flipIdx = Math.floor(Math.random() * next.length);
        next[flipIdx] = Math.random() > 0.15;
        return next;
      });

      setBufferLevel((prev) => {
        const delta = Math.random() * 8 - 3;
        const next = Math.min(95, Math.max(25, prev + delta));
        setIsPlaying(next > 30);
        return Math.round(next);
      });

      setAmat((prev) => {
        const next = 4.2 + (Math.random() * 0.6 - 0.3);
        return Math.round(next * 10) / 10;
      });

      setBlockSizeIndex((prev) => (prev + 1) % blockSizes.length);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden pt-12 md:pt-20 pb-20 md:pb-28 px-4 md:px-8 border-b-2 border-[#12151A] bg-[#F5F2EB] bg-grid-pattern">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Headlines & Call to Action */}
        <div className="lg:col-span-7 z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#12151A] text-[#CCFF00] rounded text-xs font-mono font-bold tracking-wider shadow-[3px_3px_0_#CCFF00]">
            <Disc3 size={14} className="animate-spin text-[#CCFF00]" />
            <span>VIDEO STREAMING ARCHITECTURE ANALYZER</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl text-[#12151A] leading-[1.02] tracking-tight">
            Why does your <br />
            <span className="bg-[#CCFF00] px-3 py-0.5 border-2 border-[#12151A] shadow-[4px_4px_0_#12151A] inline-block mt-1">
              video buffer?
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[#2A303A] font-medium max-w-xl leading-relaxed">
            BufferZero lets you simulate a computer’s hardware cache, bus data transfers, and DMA controller in real time. Change one setting, watch the memory accesses flow, and see whether the video plays smoothly or stalls.
          </p>

          {/* Academic Context Badge */}
          <div className="p-3 bg-[#FAF8F5] border-2 border-[#12151A] rounded-lg shadow-[3px_3px_0_#12151A] max-w-lg font-mono text-xs text-[#5A6372]">
            <p>
              <span className="font-bold text-[#12151A]">Mini Project Scope:</span> Solves how cache block sizing & DMA affect video playback. Covers <strong className="text-[#12151A]">CO4 (I/O Organization)</strong>, <strong className="text-[#12151A]">CO5 (Memory Hierarchy)</strong>, and <strong className="text-[#12151A]">CO6 (Pipelining)</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onLaunchLab}
              className="btn-primary text-sm sm:text-base py-3.5 px-6 shadow-[5px_5px_0_#12151A] hover:shadow-[7px_7px_0_#12151A]"
            >
              <Zap size={18} className="fill-[#12151A]" />
              <span>Open the Simulation Lab</span>
            </button>

            <a
              href="#how-it-works"
              className="btn-secondary text-sm sm:text-base py-3.5 px-6 shadow-[5px_5px_0_#12151A] hover:shadow-[7px_7px_0_#12151A] flex items-center gap-2"
            >
              <span>See How It Works</span>
              <ArrowDown size={16} />
            </a>
          </div>
        </div>

        {/* Right Column: Live Interactive Floating Cards Showcase */}
        <div className="lg:col-span-5 relative min-h-[460px] flex items-center justify-center">
          {/* Card 1: Hit Ratio Card (Acid Lime) */}
          <div className="absolute top-2 left-4 md:left-8 bg-[#CCFF00] border-2 border-[#12151A] p-4 rounded-lg shadow-[5px_5px_0_#12151A] w-64 transform -rotate-2 hover:rotate-0 hover:-translate-y-1 transition-all z-20">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#12151A]">
                Cache Hit Ratio
              </span>
              <span className="w-2 h-2 rounded-full bg-[#12151A] animate-ping"></span>
            </div>
            <div className="font-mono text-4xl font-extrabold text-[#12151A] mb-3">
              {hitRatio}%
            </div>
            {/* 12 cells flipping state */}
            <div className="grid grid-cols-6 gap-1.5 p-1.5 bg-[#12151A] rounded">
              {cells.map((hit, idx) => (
                <div
                  key={idx}
                  className={`h-4 rounded-xs border border-[#12151A] transition-colors duration-300 ${
                    hit ? "bg-[#CCFF00]" : "bg-[#FF3B30]"
                  }`}
                  title={hit ? "Hit" : "Miss"}
                ></div>
              ))}
            </div>
          </div>

          {/* Card 2: AMAT Formula Card (White) */}
          <div className="absolute top-36 right-0 md:right-4 bg-[#FFFFFF] border-2 border-[#12151A] p-4 rounded-lg shadow-[5px_5px_0_#12151A] w-68 transform rotate-3 hover:rotate-0 hover:-translate-y-1 transition-all z-30">
            <div className="flex items-center gap-2 mb-1.5">
              <Activity size={16} className="text-[#12151A]" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#12151A]">
                AMAT Efficiency
              </span>
            </div>
            <div className="font-mono text-3xl font-extrabold text-[#12151A]">
              {amat} <span className="text-sm font-bold text-[#5A6372]">cycles</span>
            </div>
            <div className="mt-2 pt-2 border-t border-[#12151A]/20 font-mono text-[10px] text-[#5A6372]">
              <span className="text-[#12151A] font-bold">Formula:</span> Hit Time + (Miss Rate × Miss Penalty)
            </div>
          </div>

          {/* Card 3: Video Buffer Drain/Refill Card (Navy / Ink) */}
          <div className="absolute bottom-16 left-0 md:left-6 bg-[#12151A] text-[#FFFFFF] border-2 border-[#12151A] p-4 rounded-lg shadow-[5px_5px_0_#CCFF00] w-64 transform -rotate-1 hover:rotate-0 hover:-translate-y-1 transition-all z-20">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#8E99A8]">
                Video Stream Buffer
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  isPlaying ? "bg-[#CCFF00] text-[#12151A]" : "bg-[#FF3B30] text-[#FFFFFF]"
                }`}
              >
                {isPlaying ? "Playing 60 FPS" : "Buffering..."}
              </span>
            </div>
            <div className="w-full bg-[#2A303A] h-4 rounded border border-[#5A6372] overflow-hidden p-0.5">
              <div
                className={`h-full rounded-xs transition-all duration-500 ${
                  isPlaying ? "bg-[#CCFF00]" : "bg-[#FF3B30]"
                }`}
                style={{ width: `${bufferLevel}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2 font-mono text-[10px] text-[#8E99A8]">
              <span>Level: {bufferLevel}%</span>
              <span>1080p Stream</span>
            </div>
          </div>

          {/* Card 4: DMA vs CPU Free Card (Bone/White) */}
          <div className="absolute bottom-2 right-2 md:right-8 bg-[#FAF8F5] border-2 border-[#12151A] p-3.5 rounded-lg shadow-[4px_4px_0_#12151A] w-60 transform rotate-2 hover:rotate-0 hover:-translate-y-1 transition-all z-10">
            <div className="flex items-center gap-1.5 mb-2">
              <Cpu size={14} className="text-[#12151A]" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#12151A]">
                CPU Overhead
              </span>
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div>
                <div className="flex justify-between text-[10px]">
                  <span>CPU-Driven:</span>
                  <span className="font-bold text-[#FF3B30]">18% Free (Stalled)</span>
                </div>
                <div className="w-full bg-[#EAE5DB] h-2 rounded overflow-hidden">
                  <div className="bg-[#FF3B30] h-full" style={{ width: "18%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px]">
                  <span>DMA Mode:</span>
                  <span className="font-bold text-[#12151A]">87% Free (Fast)</span>
                </div>
                <div className="w-full bg-[#EAE5DB] h-2 rounded overflow-hidden">
                  <div className="bg-[#CCFF00] h-full border border-[#12151A]" style={{ width: "87%" }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Block Size Card (Tomato / Yellow pill) */}
          <div className="absolute top-0 right-16 bg-[#12151A] border-2 border-[#12151A] text-white px-3 py-1.5 rounded-full shadow-[3px_3px_0_#CCFF00] font-mono text-[11px] font-bold flex items-center gap-2 transform -rotate-6 z-10">
            <Layers size={13} className="text-[#CCFF00]" />
            <span>Block Size:</span>
            <span className="text-[#CCFF00] underline">{blockSizes[blockSizeIndex]}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
