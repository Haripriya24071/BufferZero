import React, { useState, useEffect } from "react";
import { SimConfig, SweepResult, AnalysisSummary } from "../../engine/types";
import { SweepEngine, BLOCK_SIZES, TRANSFER_MODES } from "../../engine/sweep";
import { Sparkles, X, Check, Award, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";

interface AutoAnalyzeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: SimConfig;
  onApplyBestConfig: (best: { blockSizeB: any; transferMode: any }) => void;
}

export const AutoAnalyzeModal: React.FC<AutoAnalyzeModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onApplyBestConfig,
}) => {
  const [results, setResults] = useState<SweepResult[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisSummary | null>(null);
  const [isSweeping, setIsSweeping] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;

    setIsSweeping(true);
    setProgress(0);

    // Run sweep
    setTimeout(() => {
      const sweepResults = SweepEngine.runSweep(currentConfig, 2500, (pct) => {
        setProgress(pct);
      });
      const summary = SweepEngine.analyze(sweepResults, currentConfig.quality);
      setResults(sweepResults);
      setAnalysis(summary);
      setIsSweeping(false);

      // Trigger celebratory confetti on sweet-spot discovery!
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#CCFF00", "#12151A", "#FF3B30"],
        });
      } catch (e) {
        // Confetti fallback
      }
    }, 150);
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (analysis) {
      onApplyBestConfig(analysis.bestConfig);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#12151A]/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FFFFFF] border-3 border-[#12151A] rounded-xl shadow-[8px_8px_0_#12151A] max-w-3xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-[#12151A]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-[#CCFF00] border border-[#12151A] flex items-center justify-center">
              <Sparkles size={18} className="text-[#12151A]" />
            </div>
            <div>
              <h3 className="font-display text-2xl text-[#12151A]">
                Auto-Analyze Parameter Sweep
              </h3>
              <p className="font-mono text-xs text-[#5A6372]">
                Sweep of all Block Sizes (16B–256B) × Transfer Modes for {currentConfig.quality}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#F5F2EB] text-[#12151A] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sweep Progress if running */}
        {isSweeping ? (
          <div className="py-12 text-center space-y-3 font-mono">
            <span className="w-3 h-3 rounded-full bg-[#12151A] animate-ping inline-block"></span>
            <div className="text-sm font-bold text-[#12151A]">
              Sweeping 10 architectural configurations ({progress}%)...
            </div>
          </div>
        ) : (
          <>
            {/* Results Matrix Table */}
            <div className="border-2 border-[#12151A] rounded-lg overflow-hidden font-mono text-xs">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-[#12151A] text-white">
                    <th className="py-2.5 px-4 text-left border-r border-[#2A303A]">Block Size</th>
                    <th className="py-2.5 px-4 border-r border-[#2A303A]">CPU-Driven Mode</th>
                    <th className="py-2.5 px-4">DMA Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-t border-[#12151A]">
                  {BLOCK_SIZES.map((size) => {
                    const cpuRes = results.find(
                      (r) => r.blockSizeB === size && r.transferMode === "CPU"
                    );
                    const dmaRes = results.find(
                      (r) => r.blockSizeB === size && r.transferMode === "DMA"
                    );

                    const isCpuBest =
                      analysis?.bestConfig.blockSizeB === size &&
                      analysis?.bestConfig.transferMode === "CPU";
                    const isDmaBest =
                      analysis?.bestConfig.blockSizeB === size &&
                      analysis?.bestConfig.transferMode === "DMA";

                    return (
                      <tr key={size} className="hover:bg-[#FAF8F5]">
                        <td className="py-2 px-4 text-left font-bold border-r border-[#12151A]/10 bg-[#FAF8F5]">
                          {size} Bytes
                        </td>

                        {/* CPU Cell */}
                        <td
                          className={`py-2 px-4 border-r border-[#12151A]/10 ${
                            isCpuBest ? "bg-[#CCFF00] font-extrabold border-2 border-[#12151A]" : ""
                          }`}
                        >
                          {cpuRes && (
                            <div>
                              <span className="font-bold text-sm block">{cpuRes.amat} cyc</span>
                              <span className="text-[10px] text-[#5A6372]">
                                {cpuRes.cpuUtilizationFree}% CPU Free
                              </span>
                            </div>
                          )}
                        </td>

                        {/* DMA Cell */}
                        <td
                          className={`py-2 px-4 ${
                            isDmaBest ? "bg-[#CCFF00] font-extrabold border-2 border-[#12151A]" : ""
                          }`}
                        >
                          {dmaRes && (
                            <div>
                              <span className="font-bold text-sm block">{dmaRes.amat} cyc</span>
                              <span className="text-[10px] text-[#5A6372]">
                                {dmaRes.cpuUtilizationFree}% CPU Free
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Recommendation Card */}
            {analysis && (
              <div className="bg-[#FAF8F5] border-2 border-[#12151A] p-5 rounded-xl space-y-4 shadow-[4px_4px_0_#12151A]">
                <div className="flex items-center gap-2">
                  <Award size={20} className="text-[#12151A]" />
                  <h4 className="font-display text-lg text-[#12151A]">
                    Recommended Architecture Configuration
                  </h4>
                </div>

                <div className="p-3 bg-[#CCFF00] border-2 border-[#12151A] rounded-lg font-mono text-sm font-bold text-[#12151A]">
                  {analysis.summary}
                </div>

                <div className="space-y-2 font-mono text-xs text-[#2A303A]">
                  {analysis.reasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[#12151A] font-bold">✔</span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>

                {/* Apply Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleApply}
                    className="btn-primary text-xs py-2.5 px-5 flex items-center gap-2"
                  >
                    <span>Apply Optimal Settings to Lab</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
