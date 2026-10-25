import React, { useState } from "react";
import { SimStep, CacheGeometry } from "../../engine/types";
import { History, ChevronLeft, ChevronRight, Binary, ArrowRight } from "lucide-react";

interface RewindDebuggerProps {
  history: SimStep[];
  geometry: CacheGeometry;
  onSelectStep?: (step: SimStep) => void;
}

export const RewindDebugger: React.FC<RewindDebuggerProps> = ({
  history,
  geometry,
  onSelectStep,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(
    Math.max(0, history.length - 1)
  );

  const activeStep: SimStep | undefined = history[selectedIndex] || history[history.length - 1];

  const handleScrub = (idx: number) => {
    setSelectedIndex(idx);
    if (history[idx] && onSelectStep) {
      onSelectStep(history[idx]);
    }
  };

  const handlePrev = () => {
    if (selectedIndex > 0) {
      handleScrub(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex < history.length - 1) {
      handleScrub(selectedIndex + 1);
    }
  };

  if (!activeStep) {
    return (
      <div className="card-tactile p-5 text-center font-mono text-xs text-[#5A6372]">
        <History size={20} className="mx-auto mb-2 text-[#12151A]" />
        <span>Run the simulation to populate the Rewind Debugger history buffer.</span>
      </div>
    );
  }

  const binaryAddr = (activeStep.address >>> 0).toString(2).padStart(32, "0");
  const tagBin = binaryAddr.slice(0, geometry.tagBits);
  const indexBin = binaryAddr.slice(geometry.tagBits, geometry.tagBits + geometry.indexBits);
  const offsetBin = binaryAddr.slice(geometry.tagBits + geometry.indexBits);

  return (
    <div className="card-tactile p-5 space-y-4 bg-[#FFFFFF]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#12151A]/10">
        <div className="flex items-center gap-2">
          <History size={18} className="text-[#12151A]" />
          <div>
            <h3 className="font-display text-base text-[#12151A]">
              Rewind Cycle Debugger
            </h3>
            <span className="text-[10px] font-mono text-[#5A6372]">
              Scrub through last {history.length} memory accesses cycle-by-cycle (Viva Inspector)
            </span>
          </div>
        </div>

        {/* Stepper controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={selectedIndex <= 0}
            className="p-1.5 rounded bg-[#F5F2EB] hover:bg-[#EAE5DB] border border-[#12151A] disabled:opacity-30"
            title="Step Back 1 Cycle"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="font-mono text-xs font-bold text-[#12151A] min-w-16 text-center">
            {selectedIndex + 1} / {history.length}
          </span>

          <button
            onClick={handleNext}
            disabled={selectedIndex >= history.length - 1}
            className="p-1.5 rounded bg-[#F5F2EB] hover:bg-[#EAE5DB] border border-[#12151A] disabled:opacity-30"
            title="Step Forward 1 Cycle"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Scrub Slider */}
      <div className="space-y-1">
        <input
          type="range"
          min={0}
          max={Math.max(0, history.length - 1)}
          value={selectedIndex}
          onChange={(e) => handleScrub(Number(e.target.value))}
          className="w-full accent-[#CCFF00] cursor-pointer h-2 bg-[#EAE5DB] rounded-lg"
        />
        <div className="flex justify-between font-mono text-[9px] text-[#5A6372]">
          <span>- {history.length - 1} Cycles Ago</span>
          <span>Present Tick (Latest)</span>
        </div>
      </div>

      {/* Active Step Binary Decomposition Display */}
      <div className="bg-[#12151A] text-white p-4 rounded-lg border-2 border-[#12151A] space-y-3 font-mono">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#8E99A8]">CYCLE #{activeStep.cycle}</span>
            <span className="text-[#CCFF00] font-bold text-sm">{activeStep.hexAddress}</span>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded text-xs font-bold ${
              activeStep.hit
                ? "bg-[#CCFF00] text-[#12151A]"
                : "bg-[#FF3B30] text-white"
            }`}
          >
            {activeStep.hit ? "CACHE HIT (1 Cycle)" : "CACHE MISS (+Penalty)"}
          </span>
        </div>

        {/* Binary Breakdown Bar */}
        <div className="grid grid-cols-12 gap-1 text-center text-xs">
          <div className="col-span-7 bg-[#1E242D] p-2 rounded border border-[#2A303A]">
            <span className="text-[9px] text-[#8E99A8] block">TAG ({geometry.tagBits}b)</span>
            <span className="font-bold text-[#CCFF00]">0x{(activeStep.tag >>> 0).toString(16).toUpperCase()}</span>
            <div className="text-[9px] text-[#8E99A8] truncate mt-0.5">{tagBin}</div>
          </div>

          <div className="col-span-3 bg-[#CCFF00] text-[#12151A] p-2 rounded border border-[#12151A]">
            <span className="text-[9px] text-[#12151A] font-bold block">SET INDEX ({geometry.indexBits}b)</span>
            <span className="font-extrabold text-sm text-[#12151A]">Set #{activeStep.setIndex}</span>
            <div className="text-[9px] text-[#12151A] truncate mt-0.5">{indexBin}</div>
          </div>

          <div className="col-span-2 bg-[#2A303A] text-white p-2 rounded border border-[#5A6372]">
            <span className="text-[9px] text-[#8E99A8] block">OFFSET ({geometry.offsetBits}b)</span>
            <span className="font-bold text-white">{activeStep.offset} B</span>
            <div className="text-[9px] text-[#8E99A8] truncate mt-0.5">{offsetBin}</div>
          </div>
        </div>

        {/* Hardware Action Verdict */}
        <div className="pt-2 border-t border-[#2A303A] flex items-center justify-between text-xs text-[#EAE5DB]">
          <div className="flex items-center gap-1.5">
            <ArrowRight size={14} className="text-[#CCFF00]" />
            <span>
              Targeted Cache Set: <strong>Set {activeStep.setIndex}</strong>
            </span>
          </div>

          {activeStep.evictedTag !== undefined && (
            <span className="text-[#FF3B30] text-[11px]">
              Evicted Victim Block [Tag 0x{activeStep.evictedTag.toString(16).toUpperCase()}]
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
