import React from "react";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Sparkles,
  FileText,
  Swords,
  Layers,
} from "lucide-react";

interface LabHeaderProps {
  isRunning: boolean;
  onTogglePlay: () => void;
  onStep: () => void;
  onReset: () => void;
  speed: number;
  onChangeSpeed: (s: number) => void;
  activePreset: string;
  onSelectPreset: (presetName: string) => void;
  onOpenAutoAnalyze: () => void;
  onOpenReport: () => void;
  isRaceMode: boolean;
  onToggleRaceMode: () => void;
}

export const LabHeader: React.FC<LabHeaderProps> = ({
  isRunning,
  onTogglePlay,
  onStep,
  onReset,
  speed,
  onChangeSpeed,
  activePreset,
  onSelectPreset,
  onOpenAutoAnalyze,
  onOpenReport,
  isRaceMode,
  onToggleRaceMode,
}) => {
  const presets = [
    { id: "balanced", label: "Balanced 1080p" },
    { id: "phone", label: "Phone, 480p" },
    { id: "weak_4k", label: "Weak device, 4K" },
    { id: "scrubbing", label: "Scrubbing (Seeking)" },
  ];

  const speeds = [0.25, 0.5, 1, 2, 4];

  return (
    <div className="border-b-2 border-[#12151A] bg-[#FFFFFF] shadow-sm sticky top-[57px] z-30">
      {/* TIER 1: Dedicated Showcase & Viva Tools Bar (High-Contrast Industrial Strip) */}
      <div className="bg-[#12151A] text-white px-4 md:px-8 py-2.5 border-b border-[#2A303A]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Suite Identifier */}
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#CCFF00] animate-pulse"></div>
            <div>
              <div className="font-mono text-xs font-black tracking-wider text-[#CCFF00] uppercase flex items-center gap-2">
                <span>VIVA SHOWCASE & EVALUATION SUITE</span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 bg-[#CCFF00]/20 text-[#CCFF00] text-[9px] rounded font-bold border border-[#CCFF00]/40">
                  FLAGSHIP
                </span>
              </div>
              <p className="font-mono text-[10px] text-[#8E99A8] hidden md:block">
                Interactive demonstration tools for professors & viva evaluation
              </p>
            </div>
          </div>

          {/* Right: The 3 Separated Standout Feature Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* 1. Race Mode Button */}
            <button
              onClick={onToggleRaceMode}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border-2 transition-all flex items-center gap-2 cursor-pointer shadow-[3px_3px_0_#000000] active:translate-y-0.5 ${
                isRaceMode
                  ? "bg-[#CCFF00] text-[#12151A] border-[#CCFF00] shadow-[0_0_12px_rgba(204,255,0,0.6)]"
                  : "bg-[#1E232B] hover:bg-[#2A303A] text-white border-[#3A4250] hover:border-[#CCFF00]"
              }`}
            >
              <Swords size={16} className={isRaceMode ? "text-[#12151A]" : "text-[#CCFF00]"} />
              <div className="text-left">
                <div className="font-extrabold leading-tight">
                  {isRaceMode ? "EXIT RACE MODE" : "🏆 RACE MODE"}
                </div>
                <div className="text-[9px] font-normal opacity-80 leading-none hidden sm:block">
                  CPU vs DMA Head-to-Head
                </div>
              </div>
            </button>

            {/* 2. Auto-Analyze Button */}
            <button
              onClick={onOpenAutoAnalyze}
              className="px-3 py-1.5 rounded-lg font-mono text-xs font-bold border-2 border-[#12151A] bg-[#CCFF00] hover:bg-[#BBEE00] text-[#12151A] shadow-[3px_3px_0_#FFFFFF] active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles size={16} className="text-[#12151A]" />
              <div className="text-left">
                <div className="font-black leading-tight">✨ AUTO-ANALYZE</div>
                <div className="text-[9px] font-bold opacity-80 leading-none hidden sm:block">
                  Optimal Sweep (16B–256B)
                </div>
              </div>
            </button>

            {/* 3. Viva Report Button */}
            <button
              onClick={onOpenReport}
              className="px-3 py-1.5 rounded-lg font-mono text-xs font-bold border-2 border-[#12151A] bg-[#FFFFFF] hover:bg-[#F5F2EB] text-[#12151A] shadow-[3px_3px_0_#CCFF00] active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileText size={16} className="text-[#12151A]" />
              <div className="text-left">
                <div className="font-black leading-tight">📄 VIVA REPORT</div>
                <div className="text-[9px] text-[#5A6372] font-bold leading-none hidden sm:block">
                  Marks Rubric & Printable PDF
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* TIER 2: Pure Simulation Playback & Presets Bar */}
      <div className="px-4 md:px-8 py-2 bg-[#FFFFFF]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Presets */}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-[#5A6372] uppercase font-bold mr-1">
              Architecture Presets:
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelectPreset(p.id)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                    activePreset === p.id
                      ? "bg-[#12151A] text-[#CCFF00] font-bold border-2 border-[#12151A] shadow-[2px_2px_0_#12151A]"
                      : "bg-[#F5F2EB] hover:bg-[#EAE5DB] text-[#2A303A] border border-[#12151A]/20"
                  }`}
                  title={p.label}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Playback Transport Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePlay}
              className={`text-xs py-1 px-3.5 rounded font-mono font-bold border-2 border-[#12151A] shadow-[2px_2px_0_#12151A] flex items-center gap-1.5 cursor-pointer transition-colors ${
                isRunning
                  ? "bg-[#FF3B30] text-white hover:bg-[#E83228]"
                  : "bg-[#CCFF00] text-[#12151A] hover:bg-[#BBEE00]"
              }`}
              title="Spacebar to Play/Pause"
            >
              {isRunning ? <Pause size={13} /> : <Play size={13} className="fill-current" />}
              <span>{isRunning ? "PAUSE" : "RUN"}</span>
            </button>

            <button
              onClick={onStep}
              disabled={isRunning}
              className="text-xs py-1 px-2.5 rounded font-mono font-bold border-2 border-[#12151A] bg-[#FFFFFF] hover:bg-[#F5F2EB] shadow-[2px_2px_0_#12151A] disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              title="Step 1 memory cycle"
            >
              <SkipForward size={13} />
              <span>STEP</span>
            </button>

            <button
              onClick={onReset}
              className="text-xs py-1 px-2.5 rounded font-mono font-bold border-2 border-[#12151A] bg-[#FFFFFF] hover:bg-[#F5F2EB] shadow-[2px_2px_0_#12151A] flex items-center gap-1 cursor-pointer"
              title="Reset simulation state"
            >
              <RotateCcw size={13} />
              <span>RESET</span>
            </button>

            {/* Speeds */}
            <div className="flex items-center bg-[#F5F2EB] border-2 border-[#12151A] rounded p-0.5 ml-1 font-mono">
              <span className="text-[9px] text-[#5A6372] px-1 font-bold">SPD:</span>
              {speeds.map((s) => (
                <button
                  key={s}
                  onClick={() => onChangeSpeed(s)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                    speed === s ? "bg-[#12151A] text-[#CCFF00]" : "text-[#5A6372] hover:text-[#12151A]"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
