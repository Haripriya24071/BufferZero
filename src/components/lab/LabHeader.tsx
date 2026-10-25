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
    <div className="bg-[#FFFFFF] border-b-2 border-[#12151A] px-4 md:px-8 py-3 sticky top-[57px] z-40 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left: Mode Switcher & Presets */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Race Mode Toggle Button */}
          <button
            onClick={onToggleRaceMode}
            className={`px-3 py-1.5 rounded font-mono text-xs font-bold border-2 border-[#12151A] flex items-center gap-1.5 cursor-pointer transition-all ${
              isRaceMode
                ? "bg-[#CCFF00] text-[#12151A] shadow-[3px_3px_0_#12151A]"
                : "bg-[#F5F2EB] hover:bg-[#EAE5DB] text-[#12151A] shadow-[2px_2px_0_#12151A]"
            }`}
          >
            <Swords size={15} />
            <span>{isRaceMode ? "EXIT RACE MODE" : "🏆 RACE MODE (CPU vs DMA)"}</span>
          </button>

          {/* Preset Chips */}
          <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l-2 border-[#12151A]/20">
            <span className="font-mono text-[10px] text-[#5A6372] uppercase font-bold mr-1">
              Presets:
            </span>
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectPreset(p.id)}
                className={`px-2 py-1 rounded text-xs font-mono font-medium border transition-colors ${
                  activePreset === p.id
                    ? "bg-[#12151A] text-white border-[#12151A] font-bold"
                    : "bg-[#FAF8F5] text-[#2A303A] border-[#12151A]/20 hover:border-[#12151A]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className={`btn-primary text-xs py-1.5 px-3 shadow-[3px_3px_0_#12151A] flex items-center gap-1.5 ${
              isRunning ? "bg-[#FF3B30] text-white hover:bg-[#E83228]" : ""
            }`}
            title="Spacebar to Play/Pause"
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} className="fill-current" />}
            <span>{isRunning ? "PAUSE" : "RUN"}</span>
          </button>

          <button
            onClick={onStep}
            disabled={isRunning}
            className="btn-secondary text-xs py-1.5 px-2.5 shadow-[2px_2px_0_#12151A] disabled:opacity-40"
            title="Step 1 memory cycle"
          >
            <SkipForward size={14} />
            <span className="hidden sm:inline">STEP</span>
          </button>

          <button
            onClick={onReset}
            className="btn-secondary text-xs py-1.5 px-2.5 shadow-[2px_2px_0_#12151A]"
            title="Reset simulation state"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">RESET</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-[#F5F2EB] border border-[#12151A] rounded p-0.5 ml-1">
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors ${
                  speed === s ? "bg-[#12151A] text-[#CCFF00]" : "text-[#5A6372] hover:text-[#12151A]"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Right: Actions (Auto-Analyze & Report) */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAutoAnalyze}
            className="btn-primary text-xs py-1.5 px-3 shadow-[3px_3px_0_#12151A] bg-[#CCFF00] hover:bg-[#BBEE00] text-[#12151A] flex items-center gap-1.5"
          >
            <Sparkles size={14} />
            <span className="font-bold">AUTO-ANALYZE</span>
          </button>

          <button
            onClick={onOpenReport}
            className="btn-secondary text-xs py-1.5 px-3 shadow-[3px_3px_0_#12151A] flex items-center gap-1.5"
          >
            <FileText size={14} />
            <span className="hidden sm:inline">VIVA REPORT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
