import React, { useRef, useEffect } from "react";
import { CacheGeometry, SimStep } from "../../engine/types";
import { CacheModel } from "../../engine/cache";
import { Layers, Binary } from "lucide-react";

interface CacheVisualizerProps {
  cache: CacheModel;
  lastStep?: SimStep;
  recentSteps: SimStep[];
}

export const CacheVisualizer: React.FC<CacheVisualizerProps> = ({
  cache,
  lastStep,
  recentSteps,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const geometry = cache.geometry;

  // Format 32-bit address in binary with space groups
  const addressBinary = lastStep
    ? (lastStep.address >>> 0).toString(2).padStart(32, "0")
    : "00100000000000000000000110100100";

  const tagBinary = addressBinary.slice(0, geometry.tagBits);
  const indexBinary = addressBinary.slice(
    geometry.tagBits,
    geometry.tagBits + geometry.indexBits
  );
  const offsetBinary = addressBinary.slice(
    geometry.tagBits + geometry.indexBits
  );

  // Render cache grid on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const numSets = geometry.numSets;
    const associativity = cache.sets[0]?.length || 1;

    // Display max 32 visible sets on canvas
    const visibleSets = Math.min(32, numSets);
    const cellWidth = Math.max(16, (width - 40) / associativity);
    const cellHeight = Math.max(8, (height - 20) / visibleSets);

    for (let s = 0; s < visibleSets; s++) {
      for (let w = 0; w < associativity; w++) {
        const line = cache.sets[s]?.[w];
        const x = 30 + w * cellWidth;
        const y = 10 + s * cellHeight;

        const isCurrentTarget =
          lastStep && lastStep.setIndex === s;

        // Styling cells
        if (!line || !line.valid) {
          ctx.fillStyle = "#FFFFFF"; // Empty
        } else if (isCurrentTarget && lastStep?.hit) {
          ctx.fillStyle = "#D7FF38"; // Hit: Acid Lime
        } else if (isCurrentTarget && !lastStep?.hit) {
          ctx.fillStyle = "#FF3B30"; // Miss: Tomato
        } else {
          ctx.fillStyle = "#EBEBE6"; // Valid filled
        }

        ctx.fillRect(x, y, cellWidth - 2, cellHeight - 2);
        ctx.strokeStyle = "#171717";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellWidth - 2, cellHeight - 2);
      }
    }
  }, [cache, lastStep, geometry]);

  return (
    <div className="card-tactile p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717]/10">
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-[#171717]" />
          <h3 className="font-display text-base text-[#171717]">
            Cache Bit Inspector & Grid Visualizer
          </h3>
        </div>
        <span className="font-mono text-[11px] text-[#5A6372]">
          {geometry.numBlocks} Blocks • {geometry.numSets} Sets • {cache.sets[0]?.length || 1}-Way
        </span>
      </div>

      {/* 32-bit Address Split Bar: Tag | Index | Offset */}
      <div className="space-y-1.5 font-mono">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[#171717]">
            <Binary size={14} />
            <span>32-BIT ADDRESS:</span>
            <span className="bg-[#171717] text-[#D7FF38] px-2 py-0.5 rounded font-bold">
              {lastStep ? lastStep.hexAddress : "0x200001A4"}
            </span>
          </div>

          <div className="text-[11px] text-[#5A6372]">
            Tag: {geometry.tagBits}b | Index: {geometry.indexBits}b | Offset: {geometry.offsetBits}b
          </div>
        </div>

        {/* Visual Partition Bar */}
        <div className="grid grid-cols-12 gap-1 text-center text-xs">
          {/* Tag Segment */}
          <div className="col-span-7 bg-[#171717] text-white p-2 rounded border border-[#171717]">
            <span className="text-[10px] text-[#8E99A8] block font-bold">
              TAG ({geometry.tagBits} BITS)
            </span>
            <div className="text-[11px] font-bold text-[#D7FF38] truncate">
              {lastStep ? `0x${(lastStep.tag >>> 0).toString(16).toUpperCase()}` : "0x00020"}
            </div>
            <div className="text-[9px] text-[#8E99A8] truncate mt-0.5">{tagBinary.slice(0, 16)}...</div>
          </div>

          {/* Index Segment */}
          <div className="col-span-3 bg-[#D7FF38] text-[#171717] p-2 rounded border border-[#171717]">
            <span className="text-[10px] text-[#171717] block font-bold">
              INDEX ({geometry.indexBits} BITS)
            </span>
            <div className="text-[11px] font-extrabold text-[#171717]">
              Set {lastStep ? lastStep.setIndex : 26}
            </div>
            <div className="text-[9px] text-[#171717] truncate mt-0.5">{indexBinary}</div>
          </div>

          {/* Offset Segment */}
          <div className="col-span-2 bg-[#F5F5F0] text-[#171717] p-2 rounded border border-[#171717]">
            <span className="text-[10px] text-[#5A6372] block font-bold">
              OFFSET ({geometry.offsetBits} BITS)
            </span>
            <div className="text-[11px] font-bold text-[#171717]">
              {lastStep ? lastStep.offset : 4} B
            </div>
            <div className="text-[9px] text-[#5A6372] truncate mt-0.5">{offsetBinary}</div>
          </div>
        </div>
      </div>

      {/* Canvas Cache Set Grid */}
      <div className="bg-[#FFFFFF] border-2 border-[#171717] p-2 rounded-lg">
        <div className="flex items-center justify-between text-[10px] font-mono text-[#5A6372] px-2 mb-1">
          <span>Set 0 to {Math.min(32, geometry.numSets) - 1}</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-[#D7FF38] border border-[#171717] rounded-xs"></span>
              <span>Hit</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-[#FF3B30] border border-[#171717] rounded-xs"></span>
              <span>Miss</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-[#FFFFFF] border border-[#171717] rounded-xs"></span>
              <span>Empty</span>
            </span>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={580}
          height={160}
          className="w-full h-auto block rounded"
        />
      </div>

      {/* Recent Accesses Ticker (last 12) */}
      <div className="flex items-center justify-between gap-2 pt-1 font-mono text-xs">
        <span className="text-[11px] font-bold text-[#5A6372] uppercase shrink-0">
          Last Accesses:
        </span>
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {recentSteps.slice(-12).map((st, i) => (
            <span
              key={i}
              className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[11px] border border-[#171717] ${
                st.hit ? "bg-[#D7FF38] text-[#171717]" : "bg-[#FF3B30] text-white"
              }`}
              title={`${st.hexAddress} - Set ${st.setIndex} - ${st.hit ? "HIT" : "MISS"}`}
            >
              {st.hit ? "H" : "M"}
            </span>
          ))}
          {recentSteps.length === 0 && (
            <span className="text-xs text-[#8E99A8]">Awaiting access cycles...</span>
          )}
        </div>
      </div>
    </div>
  );
};
