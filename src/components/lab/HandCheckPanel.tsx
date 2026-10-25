import React from "react";
import { SimConfig, SimMetrics } from "../../engine/types";
import { Calculator, CheckCircle2, BookOpen } from "lucide-react";

interface HandCheckPanelProps {
  config: SimConfig;
  metrics: SimMetrics;
}

export const HandCheckPanel: React.FC<HandCheckPanelProps> = ({
  config,
  metrics,
}) => {
  const busTransfers = config.blockSizeB / config.busWidthB;
  const transferCycles = busTransfers * config.cyclesPerBusTransfer;
  const missPenalty = config.memLatencyCycles + transferCycles;

  const missRateFraction = metrics.missRatio / 100;
  const amatPenaltyTerm = Math.round(missRateFraction * missPenalty * 100) / 100;
  const calculatedAMAT = Math.round((config.hitTimeCycles + amatPenaltyTerm) * 100) / 100;

  const cpiStallTerm =
    Math.round(config.memAccessPerInstr * missRateFraction * missPenalty * 100) / 100;
  const calculatedCPI = Math.round((config.baseCPI + cpiStallTerm) * 100) / 100;

  return (
    <div className="card-tactile p-5 space-y-4 bg-[#FFFFFF]">
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#12151A]/10">
        <div className="flex items-center gap-2">
          <Calculator size={18} className="text-[#12151A]" />
          <div>
            <h3 className="font-display text-base text-[#12151A]">
              Viva Hand-Check & Formula Verification
            </h3>
            <span className="text-[10px] font-mono text-[#5A6372]">
              Real numbers plugged into COA textbook formulas (Paper checkable)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#CCFF00] text-[#12151A] rounded font-mono text-[10px] font-bold border border-[#12151A]">
          <CheckCircle2 size={13} />
          <span>VIVA DEFENSE READY</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        {/* Formula 1: Miss Penalty */}
        <div className="p-3.5 bg-[#FAF8F5] border-2 border-[#12151A] rounded-lg space-y-2">
          <span className="text-[10px] font-bold uppercase text-[#5A6372] block">
            1. Miss Penalty Formula (CO5)
          </span>
          <code className="text-[11px] text-[#12151A] block font-bold">
            Penalty = t_mem + (Block / BusWidth) × Cycles
          </code>
          <div className="p-2 bg-[#FFFFFF] border border-[#12151A]/20 rounded text-[11px] text-[#12151A]">
            = {config.memLatencyCycles} + ({config.blockSizeB} / {config.busWidthB}) × {config.cyclesPerBusTransfer} <br />
            = {config.memLatencyCycles} + ({busTransfers}) × {config.cyclesPerBusTransfer} <br />
            = <strong className="text-sm text-[#12151A] bg-[#CCFF00] px-1 rounded">{missPenalty} Cycles</strong>
          </div>
        </div>

        {/* Formula 2: AMAT */}
        <div className="p-3.5 bg-[#FAF8F5] border-2 border-[#12151A] rounded-lg space-y-2">
          <span className="text-[10px] font-bold uppercase text-[#5A6372] block">
            2. AMAT Calculation (CO5)
          </span>
          <code className="text-[11px] text-[#12151A] block font-bold">
            AMAT = HitTime + (MissRate × MissPenalty)
          </code>
          <div className="p-2 bg-[#FFFFFF] border border-[#12151A]/20 rounded text-[11px] text-[#12151A]">
            = {config.hitTimeCycles} + ({missRateFraction.toFixed(3)} × {missPenalty}) <br />
            = {config.hitTimeCycles} + {amatPenaltyTerm} <br />
            = <strong className="text-sm text-[#12151A] bg-[#CCFF00] px-1 rounded">{calculatedAMAT} Cycles</strong>
          </div>
        </div>

        {/* Formula 3: CPI */}
        <div className="p-3.5 bg-[#FAF8F5] border-2 border-[#12151A] rounded-lg space-y-2">
          <span className="text-[10px] font-bold uppercase text-[#5A6372] block">
            3. Instruction CPI (CO6)
          </span>
          <code className="text-[11px] text-[#12151A] block font-bold">
            CPI = BaseCPI + (MemAcc × MissRate × Penalty)
          </code>
          <div className="p-2 bg-[#FFFFFF] border border-[#12151A]/20 rounded text-[11px] text-[#12151A]">
            = {config.baseCPI.toFixed(1)} + ({config.memAccessPerInstr} × {missRateFraction.toFixed(3)} × {missPenalty}) <br />
            = {config.baseCPI.toFixed(1)} + {cpiStallTerm} <br />
            = <strong className="text-sm text-[#12151A] bg-[#CCFF00] px-1 rounded">{calculatedCPI} CPI</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
