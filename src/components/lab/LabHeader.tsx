import React from "react";
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Swords,
  Sliders,
} from "lucide-react";

interface LabHeaderProps {
  isRunning: boolean;
  onTogglePlay: () => void;
  onStep: () => void;
  onReset: () => void;
  speed: number;
  onChangeSpeed: (s: number) => void;
  activePreset?: string;
  onSelectPreset?: (presetName: string) => void;
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
  isRaceMode,
  onToggleRaceMode,
}) => {
  const speeds = [0.25, 0.5, 1, 2, 4];

  return (
    <div className="border-b-2 border-[#171717] bg-[#FFFFFF] shadow-sm sticky top-[57px] z-30 px-4 md:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Simulation Playback Transport (RUN/PAUSE, STEP, RESET, SPEED) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Play/Pause */}
          <button
            onClick={onTogglePlay}
            className={`text-xs py-1.5 px-3.5 rounded-lg font-mono font-bold border-2 border-[#171717] shadow-[2px_2px_0_#171717] flex items-center gap-1.5 cursor-pointer transition-all ${
              isRunning
                ? "bg-[#FF3B30] text-white hover:bg-[#E83228]"
                : "bg-[#D7FF38] text-[#171717] hover:bg-[#C5F024]"
            }`}
            title="Spacebar to Play/Pause"
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} className="fill-current" />}
            <span>{isRunning ? "PAUSE" : "RUN"}</span>
          </button>

          {/* Step */}
          <button
            onClick={onStep}
            disabled={isRunning}
            className="text-xs py-1.5 px-3 rounded-lg font-mono font-bold border-2 border-[#171717] bg-[#FFFFFF] hover:bg-[#F5F5F0] shadow-[2px_2px_0_#171717] disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
            title="Step 1 memory cycle"
          >
            <SkipForward size={14} />
            <span>STEP</span>
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="text-xs py-1.5 px-3 rounded-lg font-mono font-bold border-2 border-[#171717] bg-[#FFFFFF] hover:bg-[#F5F5F0] shadow-[2px_2px_0_#171717] flex items-center gap-1.5 cursor-pointer"
            title="Reset simulation state"
          >
            <RotateCcw size={14} />
            <span>RESET</span>
          </button>

          {/* Speeds */}
          <div className="flex items-center bg-[#F5F5F0] border-2 border-[#171717] rounded-lg p-0.5 font-mono">
            <span className="text-[10px] text-[#525252] px-1.5 font-bold">SPD:</span>
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  speed === s ? "bg-[#2457FF] text-white" : "text-[#525252] hover:text-[#171717]"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Right Side Corner: Flagship Race Mode Toggle Button */}
        <div className="flex items-center">
          <button
            onClick={onToggleRaceMode}
            className={`px-4 py-1.5 rounded-lg font-mono text-xs font-bold border-2 transition-all flex items-center gap-2 cursor-pointer shadow-[2px_2px_0_#171717] active:translate-y-0.5 ${
              isRaceMode
                ? "bg-[#2457FF] text-white border-[#171717] shadow-[3px_3px_0_#171717]"
                : "bg-[#171717] hover:bg-[#262626] text-white border-[#171717]"
            }`}
            title="Dual Architecture Race: CPU Copy vs DMA Hardware Transfer"
          >
            <Swords size={15} className={isRaceMode ? "text-white" : "text-[#D7FF38]"} />
            <span>{isRaceMode ? "EXIT RACE MODE" : "RACE MODE (CPU vs DMA)"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
