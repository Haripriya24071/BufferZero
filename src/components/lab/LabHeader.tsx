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
    <div className="border-b-2 border-[#171717] bg-[#FFFFFF] shadow-sm sticky top-[57px] z-30">
      {/* TIER 1: Dedicated Showcase & Viva Tools Bar (High-Contrast Industrial Strip) */}
      <div className="bg-[#171717] text-white px-4 md:px-8 py-2.5 border-b border-[#2A303A]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Suite Identifier */}
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#2457FF] animate-pulse"></div>
            <div>
              <div className="font-mono text-xs font-black tracking-wider text-[#D7FF38] uppercase flex items-center gap-2">
                <span>VIVA SHOWCASE & EVALUATION SUITE</span>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-[#2457FF] text-white text-[9px] rounded font-bold shadow-[1px_1px_0_#171717]">
                  TECH / AI
                </span>
              </div>
              <p className="font-mono text-[10px] text-[#8E99A8] hidden md:block">
                Interactive demonstration tools for professors & viva evaluation
              </p>
            </div>
          </div>

          {/* Right: The 3 Separated Standout Feature Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* 1. Race Mode Button (Electric Blue accent) */}
            <button
              onClick={onToggleRaceMode}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold border-2 transition-all flex items-center gap-2 cursor-pointer shadow-[3px_3px_0_#000000] active:translate-y-0.5 ${
                isRaceMode
                  ? "bg-[#2457FF] text-white border-[#2457FF] shadow-[0_0_12px_rgba(36,87,255,0.7)]"
                  : "bg-[#222222] hover:bg-[#2A303A] text-white border-[#3A4250] hover:border-[#2457FF]"
              }`}
            >
              <Swords size={16} className={isRaceMode ? "text-white" : "text-[#2457FF]"} />
              <div className="text-left">
                <div className="font-extrabold leading-tight">
                  {isRaceMode ? "EXIT RACE MODE" : "🏆 RACE MODE"}
                </div>
                <div className="text-[9px] font-normal opacity-80 leading-none hidden sm:block">
                  CPU vs DMA Head-to-Head
                </div>
              </div>
            </button>

            {/* 2. Auto-Analyze Button (Vibrant Lime #D7FF38) */}
            <button
              onClick={onOpenAutoAnalyze}
              className="px-3 py-1.5 rounded-lg font-mono text-xs font-bold border-2 border-[#171717] bg-[#D7FF38] hover:bg-[#C5F024] text-[#171717] shadow-[3px_3px_0_#2457FF] active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles size={16} className="text-[#171717]" />
              <div className="text-left">
                <div className="font-black leading-tight">✨ AUTO-ANALYZE</div>
                <div className="text-[9px] font-bold opacity-80 leading-none hidden sm:block">
                  Optimal Sweep (16B–256B)
                </div>
              </div>
            </button>

            {/* 3. Viva Report Button (Crisp White with Electric Blue shadow) */}
            <button
              onClick={onOpenReport}
              className="px-3 py-1.5 rounded-lg font-mono text-xs font-bold border-2 border-[#171717] bg-[#FFFFFF] hover:bg-[#F5F5F0] text-[#171717] shadow-[3px_3px_0_#D7FF38] active:translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileText size={16} className="text-[#2457FF]" />
              <div className="text-left">
                <div className="font-black leading-tight">📄 VIVA REPORT</div>
                <div className="text-[9px] text-[#525252] font-bold leading-none hidden sm:block">
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
            <span className="font-mono text-[10px] text-[#525252] uppercase font-bold mr-1">
              Architecture Presets:
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelectPreset(p.id)}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
                    activePreset === p.id
                      ? "bg-[#171717] text-[#D7FF38] font-bold border-2 border-[#171717] shadow-[2px_2px_0_#2457FF]"
                      : "bg-[#F5F5F0] hover:bg-[#EBEBE6] text-[#2A303A] border border-[#171717]/20"
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
              className={`text-xs py-1 px-3.5 rounded font-mono font-bold border-2 border-[#171717] shadow-[2px_2px_0_#171717] flex items-center gap-1.5 cursor-pointer transition-colors ${
                isRunning
                  ? "bg-[#FF3B30] text-white hover:bg-[#E83228]"
                  : "bg-[#D7FF38] text-[#171717] hover:bg-[#C5F024]"
              }`}
              title="Spacebar to Play/Pause"
            >
              {isRunning ? <Pause size={13} /> : <Play size={13} className="fill-current" />}
              <span>{isRunning ? "PAUSE" : "RUN"}</span>
            </button>

            <button
              onClick={onStep}
              disabled={isRunning}
              className="text-xs py-1 px-2.5 rounded font-mono font-bold border-2 border-[#171717] bg-[#FFFFFF] hover:bg-[#F5F5F0] shadow-[2px_2px_0_#171717] disabled:opacity-40 flex items-center gap-1 cursor-pointer"
              title="Step 1 memory cycle"
            >
              <SkipForward size={13} />
              <span>STEP</span>
            </button>

            <button
              onClick={onReset}
              className="text-xs py-1 px-2.5 rounded font-mono font-bold border-2 border-[#171717] bg-[#FFFFFF] hover:bg-[#F5F5F0] shadow-[2px_2px_0_#171717] flex items-center gap-1 cursor-pointer"
              title="Reset simulation state"
            >
              <RotateCcw size={13} />
              <span>RESET</span>
            </button>

            {/* Speeds */}
            <div className="flex items-center bg-[#F5F5F0] border-2 border-[#171717] rounded p-0.5 ml-1 font-mono">
              <span className="text-[9px] text-[#525252] px-1 font-bold">SPD:</span>
              {speeds.map((s) => (
                <button
                  key={s}
                  onClick={() => onChangeSpeed(s)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                    speed === s ? "bg-[#2457FF] text-white" : "text-[#525252] hover:text-[#171717]"
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
