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
    <div className="bg-[#FFFFFF] border-b-2 border-[#12151A] px-4 md:px-8 py-2 sticky top-[57px] z-30 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Mode Switcher & Presets */}
        <div className="flex items-center gap-2">
          {/* Race Mode Toggle Button */}
          <button
            onClick={onToggleRaceMode}
            className={`px-2.5 py-1 rounded font-mono text-xs font-bold border-2 border-[#12151A] flex items-center gap-1.5 cursor-pointer transition-all ${
              isRaceMode
                ? "bg-[#CCFF00] text-[#12151A] shadow-[2px_2px_0_#12151A]"
                : "bg-[#F5F2EB] hover:bg-[#EAE5DB] text-[#12151A] shadow-[2px_2px_0_#12151A]"
            }`}
          >
            <Swords size={13} />
            <span>{isRaceMode ? "EXIT RACE" : "🏆 RACE MODE"}</span>
          </button>

          {/* Preset Chips */}
          <div className="hidden md:flex items-center gap-1 pl-2 border-l border-[#12151A]/20">
            <span className="font-mono text-[10px] text-[#5A6372] uppercase font-bold mr-0.5">
              Presets:
            </span>
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectPreset(p.id)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  activePreset === p.id
                    ? "bg-[#12151A] text-[#CCFF00] font-bold"
                    : "bg-[#FAF8F5] text-[#2A303A] border border-[#12151A]/20 hover:border-[#12151A]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Playback Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onTogglePlay}
            className={`text-xs py-1 px-3 rounded font-mono font-bold border-2 border-[#12151A] shadow-[2px_2px_0_#12151A] flex items-center gap-1 cursor-pointer transition-colors ${
              isRunning ? "bg-[#FF3B30] text-white hover:bg-[#E83228]" : "bg-[#CCFF00] text-[#12151A] hover:bg-[#BBEE00]"
            }`}
            title="Spacebar to Play/Pause"
          >
            {isRunning ? <Pause size={13} /> : <Play size={13} className="fill-current" />}
            <span>{isRunning ? "PAUSE" : "RUN"}</span>
          </button>

          <button
            onClick={onStep}
            disabled={isRunning}
            className="text-xs py-1 px-2 rounded font-mono font-bold border-2 border-[#12151A] bg-[#FFFFFF] hover:bg-[#F5F2EB] shadow-[2px_2px_0_#12151A] disabled:opacity-40 flex items-center gap-1 cursor-pointer"
            title="Step 1 memory cycle"
          >
            <SkipForward size={13} />
            <span className="hidden sm:inline">STEP</span>
          </button>

          <button
            onClick={onReset}
            className="text-xs py-1 px-2 rounded font-mono font-bold border-2 border-[#12151A] bg-[#FFFFFF] hover:bg-[#F5F2EB] shadow-[2px_2px_0_#12151A] flex items-center gap-1 cursor-pointer"
            title="Reset simulation state"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">RESET</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-[#F5F2EB] border border-[#12151A] rounded p-0.5 ml-0.5 font-mono">
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors ${
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
            className="text-xs py-1 px-2.5 rounded font-mono font-bold border-2 border-[#12151A] shadow-[2px_2px_0_#12151A] bg-[#CCFF00] hover:bg-[#BBEE00] text-[#12151A] flex items-center gap-1 cursor-pointer"
          >
            <Sparkles size={13} />
            <span>AUTO-ANALYZE</span>
          </button>

          <button
            onClick={onOpenReport}
            className="text-xs py-1 px-2.5 rounded font-mono font-bold border-2 border-[#12151A] shadow-[2px_2px_0_#12151A] bg-[#FFFFFF] hover:bg-[#F5F2EB] text-[#12151A] flex items-center gap-1 cursor-pointer"
          >
            <FileText size={13} />
            <span>VIVA REPORT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
