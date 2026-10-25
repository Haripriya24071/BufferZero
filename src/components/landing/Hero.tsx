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
    <section className="relative overflow-hidden pt-12 md:pt-20 pb-20 md:pb-28 px-4 md:px-8 border-b-2 border-[#171717] bg-[#F5F5F0] bg-grid-pattern">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Headlines & Call to Action */}
        <div className="lg:col-span-7 z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#171717] text-[#D7FF38] rounded text-xs font-mono font-bold tracking-wider shadow-[3px_3px_0_#2457FF]">
            <Disc3 size={14} className="animate-spin text-[#2457FF]" />
            <span>VIDEO STREAMING ARCHITECTURE ANALYZER</span>
          </div>

          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl text-[#171717] leading-[1.02] tracking-tight">
            Why does your <br />
            <span className="bg-[#D7FF38] px-3 py-0.5 border-2 border-[#171717] shadow-[4px_4px_0_#2457FF] inline-block mt-1">
              video buffer?
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-[#262626] font-medium max-w-xl leading-relaxed">
            BufferZero lets you simulate a computer’s hardware cache, bus data transfers, and DMA controller in real time. Change one setting, watch the memory accesses flow, and see whether the video plays smoothly or stalls.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onLaunchLab}
              className="btn-primary text-sm sm:text-base py-3.5 px-6 shadow-[5px_5px_0_#171717] hover:shadow-[7px_7px_0_#2457FF]"
            >
              <Zap size={18} className="fill-[#171717]" />
              <span>Open the Simulation Lab</span>
            </button>

            <a
              href="#how-it-works"
              className="btn-secondary text-sm sm:text-base py-3.5 px-6 shadow-[5px_5px_0_#171717] hover:shadow-[7px_7px_0_#2457FF] flex items-center gap-2"
            >
              <span>See How It Works</span>
              <ArrowDown size={16} className="text-[#2457FF]" />
            </a>
          </div>
        </div>

        {/* Right Column: Live Interactive Floating Cards Showcase */}
        <div className="lg:col-span-5 relative min-h-[460px] flex items-center justify-center">
          {/* Card 1: Hit Ratio Card (Lime) */}
          <div className="absolute top-2 left-4 md:left-8 bg-[#D7FF38] border-2 border-[#171717] p-4 rounded-lg shadow-[5px_5px_0_#171717] w-64 transform -rotate-2 hover:rotate-0 hover:-translate-y-1 transition-all z-20">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#171717]">
                Cache Hit Ratio
              </span>
              <span className="w-2 h-2 rounded-full bg-[#171717] animate-ping"></span>
            </div>
            <div className="font-mono text-4xl font-extrabold text-[#171717] mb-3">
              {hitRatio}%
            </div>
            {/* 12 cells flipping state */}
            <div className="grid grid-cols-6 gap-1.5 p-1.5 bg-[#171717] rounded">
              {cells.map((hit, idx) => (
                <div
                  key={idx}
                  className={`h-4 rounded-xs border border-[#171717] transition-colors duration-300 ${
                    hit ? "bg-[#D7FF38]" : "bg-[#FF3B30]"
                  }`}
                  title={hit ? "Hit" : "Miss"}
                ></div>
              ))}
            </div>
          </div>

          {/* Card 2: AMAT Formula Card (White with Electric Blue accent) */}
          <div className="absolute top-36 right-0 md:right-4 bg-[#FFFFFF] border-2 border-[#171717] p-4 rounded-lg shadow-[5px_5px_0_#2457FF] w-68 transform rotate-3 hover:rotate-0 hover:-translate-y-1 transition-all z-30">
            <div className="flex items-center gap-2 mb-1.5">
              <Activity size={16} className="text-[#2457FF]" />
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#171717]">
                AMAT Efficiency
              </span>
            </div>
            <div className="font-mono text-3xl font-extrabold text-[#2457FF]">
              {amat} <span className="text-sm font-bold text-[#525252]">cycles</span>
            </div>
            <div className="mt-2 pt-2 border-t border-[#171717]/20 font-mono text-[10px] text-[#525252]">
              <span className="text-[#171717] font-bold">Formula:</span> Hit Time + (Miss Rate × Miss Penalty)
            </div>
          </div>

          {/* Card 3: Video Buffer Drain/Refill Card */}
          <div className="absolute bottom-16 left-0 md:left-6 bg-[#171717] text-[#FFFFFF] border-2 border-[#171717] p-4 rounded-lg shadow-[5px_5px_0_#D7FF38] w-64 transform -rotate-1 hover:rotate-0 hover:-translate-y-1 transition-all z-20">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#8E99A8]">
                Video Stream Buffer
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  isPlaying ? "bg-[#D7FF38] text-[#171717]" : "bg-[#FF3B30] text-[#FFFFFF]"
                }`}
              >
                {isPlaying ? "Playing 60 FPS" : "Buffering..."}
              </span>
            </div>
            <div className="w-full bg-[#262626] h-4 rounded border border-[#525252] overflow-hidden p-0.5">
              <div
                className={`h-full rounded-xs transition-all duration-500 ${
                  isPlaying ? "bg-[#2457FF]" : "bg-[#FF3B30]"
                }`}
                style={{ width: `${bufferLevel}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2 font-mono text-[10px] text-[#8E99A8]">
              <span>Level: {bufferLevel}%</span>
              <span>1080p Stream</span>
            </div>
          </div>

          {/* Card 4: DMA vs CPU Free Card */}
          <div className="absolute bottom-2 right-2 md:right-8 bg-[#FFFFFF] border-2 border-[#171717] p-3.5 rounded-lg shadow-[4px_4px_0_#171717] w-60 transform rotate-2 hover:rotate-0 hover:-translate-y-1 transition-all z-10">
            <div className="flex items-center gap-1.5 mb-2">
              <Cpu size={14} className="text-[#2457FF]" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#171717]">
                CPU Overhead
              </span>
            </div>
            <div className="space-y-1.5 font-mono text-[11px]">
              <div>
                <div className="flex justify-between text-[10px]">
                  <span>CPU-Driven:</span>
                  <span className="font-bold text-[#FF3B30]">18% Free (Stalled)</span>
                </div>
                <div className="w-full bg-[#EBEBE6] h-2 rounded overflow-hidden">
                  <div className="bg-[#FF3B30] h-full" style={{ width: "18%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px]">
                  <span>DMA Mode:</span>
                  <span className="font-bold text-[#2457FF]">87% Free (Fast)</span>
                </div>
                <div className="w-full bg-[#EBEBE6] h-2 rounded overflow-hidden">
                  <div className="bg-[#2457FF] h-full border border-[#171717]" style={{ width: "87%" }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Block Size Card */}
          <div className="absolute top-0 right-16 bg-[#171717] border-2 border-[#171717] text-white px-3 py-1.5 rounded-full shadow-[3px_3px_0_#2457FF] font-mono text-[11px] font-bold flex items-center gap-2 transform -rotate-6 z-10">
            <Layers size={13} className="text-[#2457FF]" />
            <span>Block Size:</span>
            <span className="text-[#D7FF38] underline">{blockSizes[blockSizeIndex]}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
