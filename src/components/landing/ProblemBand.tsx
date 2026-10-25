import React from "react";
import { Film, HardDriveDownload, Gauge } from "lucide-react";

export const ProblemBand: React.FC = () => {
  const cards = [
    {
      num: "01",
      icon: Film,
      title: "Video is data",
      text: "A 1080p stream needs millions of bytes every second. Every single frame, color plane, and macroblock must be fetched from physical memory before it can be rendered.",
      highlight: "Millions of bytes/sec",
    },
    {
      num: "02",
      icon: HardDriveDownload,
      title: "Memory is slow",
      text: "A modern CPU executes instructions in fractions of a nanosecond, but main DRAM takes over 80 clock cycles to respond. Fast on-chip cache exists to hide this punishing memory latency.",
      highlight: "80+ cycles DRAM stall",
    },
    {
      num: "03",
      icon: Gauge,
      title: "Hardware settings decide",
      text: "Cache block size and how data is transferred (programmed CPU polling vs DMA controller) is the literal hardware difference between buttery 60 FPS playback and a frozen buffering spinner.",
      highlight: "CPU vs DMA & Block Size",
    },
  ];

  return (
    <section id="problem" className="py-16 md:py-24 px-4 md:px-8 bg-[#CCFF00] border-b-2 border-[#12151A]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <span className="font-mono text-xs uppercase tracking-widest text-[#12151A] font-bold px-2.5 py-1 bg-[#FFFFFF] border border-[#12151A] rounded inline-block shadow-[2px_2px_0_#12151A]">
            Core Engineering Context
          </span>
          <h2 className="font-display text-3xl sm:text-5xl text-[#12151A] mt-3 tracking-tight">
            The problem in 30 seconds
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="bg-[#FFFFFF] border-2 border-[#12151A] p-6 md:p-8 rounded-lg shadow-[6px_6px_0_#12151A] flex flex-col justify-between hover:-translate-y-1.5 transition-transform"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-display text-4xl text-[#12151A]">
                      {card.num}
                    </span>
                    <div className="w-10 h-10 rounded-md bg-[#F5F2EB] border border-[#12151A] flex items-center justify-center shadow-[2px_2px_0_#12151A]">
                      <Icon size={20} className="text-[#12151A]" />
                    </div>
                  </div>

                  <h3 className="font-display text-2xl text-[#12151A] mb-3">
                    {card.title}
                  </h3>

                  <p className="text-sm md:text-base text-[#2A303A] leading-relaxed">
                    {card.text}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#12151A]/10">
                  <span className="text-[11px] font-mono font-bold text-[#12151A] uppercase tracking-wide bg-[#CCFF00]/40 px-2 py-0.5 rounded">
                    Key Fact: {card.highlight}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
