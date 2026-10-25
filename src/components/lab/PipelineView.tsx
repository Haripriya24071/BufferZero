import React, { useState } from "react";
import { GitCommit, AlertCircle, ArrowRight } from "lucide-react";

interface PipelineViewProps {
  missRatio: number;
  missPenalty: number;
}

export const PipelineView: React.FC<PipelineViewProps> = ({
  missRatio,
  missPenalty,
}) => {
  const [memInstrPct, setMemInstrPct] = useState<number>(30); // 30% memory instructions default

  // Calculate stalls
  const stallCyclesPerInstr = (memInstrPct / 100) * (missRatio / 100) * (missPenalty * 0.05);
  const idealCPI = 1.0;
  const actualCPI = Math.round((idealCPI + stallCyclesPerInstr) * 100) / 100;

  // Pipeline instructions mock for visual Gantt chart
  const instructions = [
    { id: "I1: LOAD Macroblock", hasMiss: false },
    { id: "I2: ADD R1, R2, R3", hasMiss: false },
    { id: "I3: LOAD VLC Table", hasMiss: missRatio > 10 },
    { id: "I4: DECODE DCT Block", hasMiss: false },
    { id: "I5: STORE Frame Buffer", hasMiss: false },
  ];

  const stages = ["IF", "ID", "EX", "MEM", "WB"];

  return (
    <div className="card-tactile p-5 space-y-5 bg-[#FFFFFF]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#12151A]/10">
        <div>
          <div className="flex items-center gap-2">
            <GitCommit size={18} className="text-[#12151A]" />
            <h3 className="font-display text-base text-[#12151A]">
              5-Stage Instruction Pipeline (CO6)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#5A6372]">
            Visualizing memory stall hazard bubbles injected during cache misses
          </span>
        </div>

        {/* CPI comparison badge */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#12151A] rounded">
            Ideal CPI: <strong>1.00</strong>
          </span>
          <ArrowRight size={13} className="text-[#5A6372]" />
          <span className="px-2 py-0.5 bg-[#CCFF00] border border-[#12151A] rounded font-bold text-[#12151A]">
            Actual CPI: {actualCPI}
          </span>
        </div>
      </div>

      {/* Pipeline Gantt Timeline */}
      <div className="bg-[#FAF8F5] border-2 border-[#12151A] p-4 rounded-lg overflow-x-auto">
        <div className="min-w-[500px] space-y-2 font-mono text-xs">
          {instructions.map((instr, idx) => {
            const offset = idx * 2;

            return (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-[11px] font-bold text-[#12151A] truncate">
                  {instr.id}
                </span>

                <div className="flex items-center gap-1.5 flex-1">
                  {/* Leading empty offset space */}
                  {Array.from({ length: offset }).map((_, oIdx) => (
                    <div key={oIdx} className="w-8 h-7"></div>
                  ))}

                  {/* Standard 5 Stages */}
                  {stages.map((stage) => {
                    const isMem = stage === "MEM";
                    const isStalled = isMem && instr.hasMiss;

                    return (
                      <div
                        key={stage}
                        className={`h-7 px-2 rounded flex items-center justify-center font-bold text-[10px] border border-[#12151A] ${
                          isStalled
                            ? "bg-[#FF3B30] text-white shadow-[2px_2px_0_#12151A] animate-pulse"
                            : stage === "MEM"
                            ? "bg-[#CCFF00] text-[#12151A]"
                            : "bg-[#FFFFFF] text-[#12151A]"
                        }`}
                        title={isStalled ? "MEM Cache Miss Bubble Stall" : `${stage} Stage`}
                      >
                        {isStalled ? "STALL (BUBBLE)" : stage}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Memory instructions % Slider */}
      <div className="space-y-1.5 font-mono text-xs">
        <div className="flex justify-between">
          <span className="text-[#12151A] font-bold">
            Memory Instruction Frequency (LOAD / STORE %):
          </span>
          <span className="font-extrabold text-[#12151A] bg-[#CCFF00] px-1.5 py-0.5 rounded border border-[#12151A]">
            {memInstrPct}%
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={60}
          value={memInstrPct}
          onChange={(e) => setMemInstrPct(Number(e.target.value))}
          className="w-full accent-[#CCFF00] cursor-pointer h-2 bg-[#EAE5DB] rounded-lg"
        />
        <p className="text-[10px] text-[#5A6372]">
          Higher memory instruction frequency increases sensitivity to cache miss penalties.
        </p>
      </div>
    </div>
  );
};
