import React, { useState } from "react";
import { CONCEPTS, ConceptItem } from "../../data/concepts";
import { ChevronRight, RotateCw, Lightbulb } from "lucide-react";

export const ConceptCards: React.FC = () => {
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const toggleFlip = (id: string) => {
    setFlippedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <section id="concepts" className="py-20 md:py-28 px-4 md:px-8 bg-[#F5F5F0] text-[#171717] border-b-2 border-[#171717]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-[#171717] font-bold px-3 py-1 bg-[#D7FF38] border border-[#171717] rounded inline-block shadow-[2px_2px_0_#171717]">
              COA Theory Breakdown
            </span>
            <h2 className="font-display text-4xl sm:text-5xl text-[#171717] mt-3 tracking-tight">
              Concepts, explained simply
            </h2>
          </div>
          <p className="text-sm font-mono text-[#525252] max-w-md">
            Click any card to flip it and explore why each architectural concept directly dictates video streaming performance.
          </p>
        </div>

        {/* 5 Concept Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {CONCEPTS.map((concept: ConceptItem, idx: number) => {
            const isFlipped = !!flippedCards[concept.id];
            return (
              <div
                key={concept.id}
                onClick={() => toggleFlip(concept.id)}
                className={`cursor-pointer rounded-xl border-2 border-[#171717] p-6 transition-all duration-300 transform select-none min-h-[320px] flex flex-col justify-between ${
                  isFlipped
                    ? "bg-[#D7FF38] text-[#171717] shadow-[6px_6px_0_#171717] -translate-y-1"
                    : "bg-[#FFFFFF] hover:bg-[#FAFAF7] text-[#171717] shadow-[4px_4px_0_#171717] hover:shadow-[6px_6px_0_#2457FF] hover:-translate-y-1"
                }`}
              >
                {!isFlipped ? (
                  /* Front Side */
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#2457FF] text-white border border-[#171717]">
                        0{idx + 1}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-mono text-[#525252] font-bold">
                        <RotateCw size={12} />
                        <span>Click to Flip</span>
                      </div>
                    </div>

                    <h3 className="font-display text-2xl text-[#171717] mb-2">{concept.title}</h3>

                    {/* Analogy Box */}
                    <div className="p-3 bg-[#F5F5F0] border border-[#171717] rounded-lg mb-4 flex items-start gap-2.5">
                      <Lightbulb size={16} className="text-[#2457FF] shrink-0 mt-0.5" />
                      <p className="font-mono text-xs text-[#171717] leading-snug">
                        <strong className="text-[#2457FF]">Analogy:</strong> {concept.analogy}
                      </p>
                    </div>

                    <p className="text-xs sm:text-sm text-[#525252] leading-relaxed mb-4">
                      {concept.summary}
                    </p>
                  </div>
                ) : (
                  /* Back Side: Why it matters for streaming & formula */
                  <div>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-[#171717]">
                      <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#171717]">
                        Streaming Impact
                      </span>
                      <span className="font-mono text-[10px] text-[#171717] font-bold px-2 py-0.5 bg-[#FFFFFF] rounded border border-[#171717]">
                        {concept.title}
                      </span>
                    </div>

                    <p className="font-medium text-xs sm:text-sm text-[#171717] leading-relaxed mb-4">
                      {concept.whyItMatters}
                    </p>

                    <div className="space-y-1.5 mb-4">
                      {concept.detailedPoints.map((point, pIdx) => (
                        <div key={pIdx} className="flex items-start gap-2 text-[11px] font-mono text-[#171717]">
                          <ChevronRight size={13} className="shrink-0 mt-0.5 text-[#2457FF]" />
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer of card */}
                {concept.formula && (
                  <div className={`pt-3 border-t font-mono text-[11px] ${
                    isFlipped ? "border-[#171717]/20 text-[#171717]" : "border-[#171717]/10 text-[#171717]"
                  }`}>
                    <span className="opacity-70 text-[10px] block font-bold text-[#525252]">FORMULA</span>
                    <code className="font-bold text-[#2457FF]">{concept.formula}</code>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Compact Formula Strip */}
        <div className="bg-[#FFFFFF] border-2 border-[#171717] p-6 rounded-xl shadow-[6px_6px_0_#171717]">
          <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-[#FFFFFF] bg-[#2457FF] px-2 py-0.5 rounded border border-[#171717] inline-block mb-3">
            CORE COMPUTER ORGANIZATION ARCHITECTURE FORMULAS
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs sm:text-sm">
            <div className="p-3 bg-[#F5F5F0] rounded-lg border-2 border-[#171717]">
              <span className="text-[#525252] block text-[10px] font-bold mb-1">AVERAGE MEMORY ACCESS TIME (AMAT)</span>
              <span className="text-[#171717] font-bold">AMAT = Hit Time + (Miss Rate × Miss Penalty)</span>
            </div>
            <div className="p-3 bg-[#F5F5F0] rounded-lg border-2 border-[#171717]">
              <span className="text-[#525252] block text-[10px] font-bold mb-1">CYCLES PER INSTRUCTION (CPI)</span>
              <span className="text-[#171717] font-bold">CPI = Base CPI + (Mem Accesses/Instr × Miss Rate × Miss Penalty)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
