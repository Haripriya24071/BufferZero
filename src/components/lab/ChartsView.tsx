import React, { useState } from "react";
import { BlockSizeB, TransferMode, SimConfig } from "../../engine/types";
import { TimingModel } from "../../engine/timing";
import { BarChart2, TrendingUp, Cpu, Info } from "lucide-react";

interface ChartsViewProps {
  currentConfig: SimConfig;
}

export const ChartsView: React.FC<ChartsViewProps> = ({ currentConfig }) => {
  const [activeChart, setActiveChart] = useState<"amat" | "hitrate" | "cpufree">("amat");

  const blockSizes: BlockSizeB[] = [16, 32, 64, 128, 256];

  // Mathematical simulated curve data across block sizes
  const data = blockSizes.map((size) => {
    // Model miss rates: sequential video benefits greatly up to 64B/128B
    let missRate = 0.38;
    if (size === 32) missRate = 0.20;
    if (size === 64) missRate = 0.08;
    if (size === 128) missRate = 0.06;
    if (size === 256) missRate = 0.08; // starts rising or diminishing returns

    const penalty = TimingModel.calculateMissPenalty(size, currentConfig.busWidthB, 80, 4);
    const amat = TimingModel.calculateAMAT(1 - missRate, penalty, 1);
    const hitRate = Math.round((1 - missRate) * 100);

    return {
      size,
      hitRate,
      penalty,
      amat: Math.round(amat * 10) / 10,
    };
  });

  // Find minimum AMAT point on the U-shaped curve
  const minAmatItem = [...data].sort((a, b) => a.amat - b.amat)[0];

  return (
    <div className="card-tactile p-5 space-y-5 bg-[#FFFFFF]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#12151A]/10">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-[#12151A]" />
            <h3 className="font-display text-base text-[#12151A]">
              Architecture Performance Analysis (CO5 Curves)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#5A6372]">
            Empirical trade-offs across cache block sizes and I/O transfer modes
          </span>
        </div>

        {/* Chart View Switcher */}
        <div className="flex items-center gap-1 font-mono text-xs">
          <button
            onClick={() => setActiveChart("amat")}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeChart === "amat"
                ? "bg-[#12151A] text-[#CCFF00] font-bold"
                : "bg-[#F5F2EB] text-[#12151A] hover:bg-[#EAE5DB]"
            }`}
          >
            U-Shaped AMAT Curve
          </button>
          <button
            onClick={() => setActiveChart("hitrate")}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeChart === "hitrate"
                ? "bg-[#12151A] text-[#CCFF00] font-bold"
                : "bg-[#F5F2EB] text-[#12151A] hover:bg-[#EAE5DB]"
            }`}
          >
            Hit Ratio
          </button>
          <button
            onClick={() => setActiveChart("cpufree")}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeChart === "cpufree"
                ? "bg-[#12151A] text-[#CCFF00] font-bold"
                : "bg-[#F5F2EB] text-[#12151A] hover:bg-[#EAE5DB]"
            }`}
          >
            CPU Free %
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      {activeChart === "amat" && (
        <div className="space-y-3">
          <div className="bg-[#FAF8F5] border-2 border-[#12151A] p-4 rounded-lg">
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="font-bold text-[#12151A]">
                AVERAGE MEMORY ACCESS TIME (CYCLES) VS BLOCK SIZE:
              </span>
              <span className="px-2 py-0.5 bg-[#CCFF00] border border-[#12151A] rounded text-[10px] font-bold">
                Sweet Spot: {minAmatItem.size} B ({minAmatItem.amat} cycles)
              </span>
            </div>

            {/* SVG U-Shaped Curve */}
            <div className="h-44 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 140">
                {/* Horizontal reference grid lines */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="#EAE5DB" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="40" y1="60" x2="480" y2="60" stroke="#EAE5DB" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="40" y1="100" x2="480" y2="100" stroke="#EAE5DB" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="40" y1="120" x2="480" y2="120" stroke="#12151A" strokeWidth="2" />

                {/* Y-Axis Labels */}
                <text x="10" y="25" fill="#5A6372" fontSize="9" fontFamily="monospace">35c</text>
                <text x="10" y="65" fill="#5A6372" fontSize="9" fontFamily="monospace">20c</text>
                <text x="10" y="105" fill="#5A6372" fontSize="9" fontFamily="monospace">10c</text>

                {/* Coordinates for points: 16B (70, 30), 32B (160, 75), 64B (260, 102), 128B (360, 95), 256B (450, 70) */}
                {/* Smooth U-Curve Path */}
                <path
                  d="M 70 30 Q 160 85 260 102 T 450 70"
                  fill="none"
                  stroke="#12151A"
                  strokeWidth="3.5"
                />

                {/* Data Points */}
                {data.map((item, idx) => {
                  const coords = [
                    { x: 70, y: 30 },
                    { x: 160, y: 75 },
                    { x: 260, y: 102 },
                    { x: 360, y: 95 },
                    { x: 450, y: 70 },
                  ][idx];

                  const isMin = item.size === minAmatItem.size;

                  return (
                    <g key={item.size}>
                      <circle
                        cx={coords.x}
                        cy={coords.y}
                        r={isMin ? 7 : 4}
                        fill={isMin ? "#CCFF00" : "#12151A"}
                        stroke="#12151A"
                        strokeWidth="2"
                      />
                      <text
                        x={coords.x}
                        y={coords.y - 10}
                        textAnchor="middle"
                        fill="#12151A"
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {item.amat}c
                      </text>
                      <text
                        x={coords.x}
                        y="134"
                        textAnchor="middle"
                        fill="#5A6372"
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {item.size}B
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="p-3 bg-[#12151A] text-white rounded-lg font-mono text-xs flex items-start gap-2">
            <Info size={16} className="text-[#CCFF00] shrink-0 mt-0.5" />
            <p className="text-[11px] text-[#EAE5DB] leading-relaxed">
              <strong>Viva Explanation:</strong> Notice the distinct <strong>U-shape</strong>. At 16B, high miss rate increases AMAT. At 64B, spatial locality drives AMAT to its minimum ({minAmatItem.amat}c). Beyond 128B, the bus transfer penalty (208 cycles) forces AMAT to rise again!
            </p>
          </div>
        </div>
      )}

      {/* Hit Rate View */}
      {activeChart === "hitrate" && (
        <div className="bg-[#FAF8F5] border-2 border-[#12151A] p-4 rounded-lg space-y-4 font-mono text-xs">
          <span className="font-bold text-[#12151A] block">
            CACHE HIT RATIO (%) VS BLOCK SIZE:
          </span>
          <div className="space-y-2">
            {data.map((item) => (
              <div key={item.size} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span>Block Size {item.size} Bytes:</span>
                  <span className="font-bold text-[#12151A]">{item.hitRate}% Hit Ratio</span>
                </div>
                <div className="w-full h-3 bg-[#EAE5DB] rounded overflow-hidden border border-[#12151A]">
                  <div
                    className="h-full bg-[#CCFF00]"
                    style={{ width: `${item.hitRate}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CPU Free View */}
      {activeChart === "cpufree" && (
        <div className="bg-[#FAF8F5] border-2 border-[#12151A] p-4 rounded-lg space-y-4 font-mono text-xs">
          <span className="font-bold text-[#12151A] block">
            CPU HEADROOM COMPARISON: CPU-DRIVEN VS DMA
          </span>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span>CPU-Driven (Programmed I/O):</span>
                <span className="font-bold text-[#FF3B30]">18% Free (Core Stalled)</span>
              </div>
              <div className="w-full h-4 bg-[#EAE5DB] rounded overflow-hidden border border-[#12151A]">
                <div className="h-full bg-[#FF3B30]" style={{ width: "18%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span>DMA Mode (Hardware Co-processor):</span>
                <span className="font-bold text-[#12151A]">87% Free (Full Decode Speed)</span>
              </div>
              <div className="w-full h-4 bg-[#EAE5DB] rounded overflow-hidden border border-[#12151A]">
                <div className="h-full bg-[#CCFF00]" style={{ width: "87%" }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
