import React from "react";
import {
  SimConfig,
  CacheSizeKB,
  BlockSizeB,
  Associativity,
  ReplacementPolicy,
  TransferMode,
  VideoQuality,
  AccessPattern,
} from "../../engine/types";
import { BITRATE_MBPS } from "../../engine/timing";
import {
  Sliders,
  HardDrive,
  Cpu,
  Radio,
  Film,
  Swords,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
} from "lucide-react";

interface ControlsProps {
  config: SimConfig;
  onChangeConfig: (partial: Partial<SimConfig>) => void;
  onResetDefaults: () => void;
  // Playback & Simulation Transport Controls (Moved to top of Controls)
  isRunning: boolean;
  onTogglePlay: () => void;
  onStep: () => void;
  onReset: () => void;
  speed: number;
  onChangeSpeed: (s: number) => void;
  activePreset?: string;
  onSelectPreset?: (presetName: string) => void;
  isRaceMode?: boolean;
  onToggleRaceMode?: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  config,
  onChangeConfig,
  onResetDefaults,
  isRunning,
  onTogglePlay,
  onStep,
  onReset,
  speed,
  onChangeSpeed,
  activePreset = "balanced",
  onSelectPreset,
  isRaceMode = false,
  onToggleRaceMode,
}) => {
  const [showAdvanced, setShowAdvanced] = React.useState<boolean>(false);

  const speeds = [0.25, 0.5, 1, 2, 4];

  const presets = [
    {
      id: "balanced",
      label: "Balanced (1080p)",
      tooltip: "Optimal sweet spot for everyday 1080p streaming with DMA hardware transfer",
    },
    {
      id: "phone",
      label: "Phone (480p)",
      tooltip: "Low-power mobile tier with compact cache footprint",
    },
    {
      id: "weak_4k",
      label: "Weak Device (4K)",
      tooltip: "Stresses CPU-driven word copying under heavy 4K bitrates, exposing stall bottlenecks",
    },
    {
      id: "scrubbing",
      label: "Seek Scrubbing",
      tooltip: "Forces non-sequential macroblock access, causing spatial cache thrashing",
    },
  ];

  const cacheSizes: CacheSizeKB[] = [4, 8, 16, 32, 64];
  const blockSizes: BlockSizeB[] = [16, 32, 64, 128, 256];
  const associativities: { val: Associativity; label: string }[] = [
    { val: 1, label: "Direct" },
    { val: 2, label: "2-Way" },
    { val: 4, label: "4-Way" },
    { val: 8, label: "8-Way" },
  ];
  const replacements: ReplacementPolicy[] = ["LRU", "FIFO", "Random"];
  const qualities: VideoQuality[] = ["480p", "720p", "1080p", "4K"];

  // Size visualization scaling for block size box
  const blockSizeBoxWidth = Math.max(16, (config.blockSizeB / 256) * 54);

  return (
    <div className="card-tactile p-5 space-y-4 h-full flex flex-col justify-between">
      {/* Title Header with Reset Defaults */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717]/10">
        <div className="flex items-center gap-2">
          <Sliders size={18} className="text-[#171717]" />
          <h3 className="font-display text-lg text-[#171717]">Architecture Controls</h3>
        </div>
        <button
          onClick={onResetDefaults}
          className="text-[11px] font-mono text-[#525252] hover:text-[#2457FF] underline cursor-pointer"
        >
          Reset Defaults
        </button>
      </div>

      {/* 1. PRIMARY SIMULATION TRANSPORT (RUN, PAUSE, STEP, RESET, SPEED, RACE MODE) */}
      <div className="p-3 bg-[#F5F5F0] border-2 border-[#171717] rounded-xl shadow-[2px_2px_0_#171717] space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
            <Cpu size={13} className="text-[#2457FF]" />
            <span>Simulation Transport</span>
          </span>
          <span
            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
              isRunning ? "bg-[#D7FF38] text-[#171717]" : "bg-[#EBEBE6] text-[#525252]"
            }`}
          >
            {isRunning ? "ACTIVE" : "PAUSED"}
          </span>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-3 gap-2">
          {/* RUN / PAUSE Button */}
          <button
            onClick={onTogglePlay}
            className={`py-2 px-3 rounded-lg font-mono text-xs font-bold border-2 border-[#171717] shadow-[2px_2px_0_#171717] flex items-center justify-center gap-1.5 cursor-pointer transition-all active:translate-y-0.5 ${
              isRunning
                ? "bg-[#FF3B30] text-white hover:bg-[#E83228]"
                : "bg-[#D7FF38] text-[#171717] hover:bg-[#C5F024]"
            }`}
            title="Spacebar to Play/Pause"
          >
            {isRunning ? <Pause size={14} /> : <Play size={14} className="fill-current" />}
            <span>{isRunning ? "PAUSE" : "RUN"}</span>
          </button>

          {/* STEP Button */}
          <button
            onClick={onStep}
            disabled={isRunning}
            className="py-2 px-3 rounded-lg font-mono text-xs font-bold border-2 border-[#171717] bg-[#FFFFFF] hover:bg-[#F5F5F0] shadow-[2px_2px_0_#171717] disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:translate-y-0.5"
            title="Step 1 memory cycle"
          >
            <SkipForward size={14} />
            <span>STEP</span>
          </button>

          {/* RESET Button */}
          <button
            onClick={onReset}
            className="py-2 px-3 rounded-lg font-mono text-xs font-bold border-2 border-[#171717] bg-[#FFFFFF] hover:bg-[#F5F5F0] shadow-[2px_2px_0_#171717] flex items-center justify-center gap-1.5 cursor-pointer transition-all active:translate-y-0.5"
            title="Reset simulation state"
          >
            <RotateCcw size={14} />
            <span>RESET</span>
          </button>
        </div>

        {/* Speed Row + Race Mode Button */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {/* Speeds */}
          <div className="flex items-center bg-[#FFFFFF] border-2 border-[#171717] rounded-lg p-0.5 font-mono">
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

          {/* Race Mode Trigger */}
          {onToggleRaceMode && (
            <button
              onClick={onToggleRaceMode}
              className={`py-1.5 px-3 rounded-lg font-mono text-xs font-bold border-2 transition-all flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0_#171717] active:translate-y-0.5 ${
                isRaceMode
                  ? "bg-[#2457FF] text-white border-[#171717]"
                  : "bg-[#171717] hover:bg-[#262626] text-white border-[#171717]"
              }`}
              title="Dual Architecture Race: CPU Copy vs DMA Hardware Transfer"
            >
              <Swords size={13} className={isRaceMode ? "text-white" : "text-[#D7FF38]"} />
              <span>{isRaceMode ? "EXIT RACE" : "RACE MODE"}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. WORKLOAD PRESETS */}
      <div className="space-y-2">
        <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
          <Sliders size={13} className="text-[#2457FF]" />
          <span>Workload Presets</span>
        </label>

        <div className="grid grid-cols-2 gap-2">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectPreset?.(p.id)}
              className={`py-2 px-2.5 rounded-lg text-center font-mono text-xs font-bold transition-all cursor-pointer ${
                activePreset === p.id
                  ? "bg-[#171717] text-[#D7FF38] border-2 border-[#171717] shadow-[2px_2px_0_#2457FF]"
                  : "bg-[#F5F5F0] hover:bg-[#EBEBE6] text-[#171717] border border-[#171717]/30"
              }`}
              title={p.tooltip}
            >
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. BIG TWO-STATE TRANSFER MODE SWITCH (CPU vs DMA) */}
      <div className="space-y-2">
        <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
          <Radio size={13} className="text-[#2457FF]" />
          <span>Data Transfer Architecture</span>
        </label>

        <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#F5F5F0] border-2 border-[#171717] rounded-lg">
          <button
            onClick={() => onChangeConfig({ transferMode: "CPU" })}
            className={`py-2.5 px-3 rounded font-mono text-xs font-extrabold tracking-wider transition-all cursor-pointer ${
              config.transferMode === "CPU"
                ? "bg-[#FF3B30] text-white shadow-[2px_2px_0_#171717] border border-[#171717]"
                : "text-[#171717] hover:bg-[#EBEBE6]"
            }`}
          >
            CPU-DRIVEN
          </button>

          <button
            onClick={() => onChangeConfig({ transferMode: "DMA" })}
            className={`py-2.5 px-3 rounded font-mono text-xs font-extrabold tracking-wider transition-all cursor-pointer ${
              config.transferMode === "DMA"
                ? "bg-[#2457FF] text-white shadow-[2px_2px_0_#171717] border border-[#171717]"
                : "text-[#171717] hover:bg-[#EBEBE6]"
            }`}
          >
            DMA CONTROLLER
          </button>
        </div>
      </div>

      {/* 4. BLOCK SIZE */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
            <HardDrive size={13} className="text-[#2457FF]" />
            <span>Cache Block Size (L1 Line)</span>
          </label>
          <div className="flex items-center gap-2">
            <div
              className="h-3.5 bg-[#D7FF38] border border-[#171717] rounded-xs transition-all duration-200"
              style={{ width: `${blockSizeBoxWidth}px` }}
              title={`Block Size: ${config.blockSizeB} Bytes`}
            ></div>
            <span className="font-mono text-xs font-extrabold text-[#171717] bg-[#D7FF38] px-1.5 py-0.5 rounded border border-[#171717]">
              {config.blockSizeB} B
            </span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {blockSizes.map((size) => (
            <button
              key={size}
              onClick={() => onChangeConfig({ blockSizeB: size })}
              className={`py-2 rounded font-mono text-xs font-bold transition-all cursor-pointer ${
                config.blockSizeB === size
                  ? "bg-[#171717] text-[#D7FF38] shadow-[2px_2px_0_#2457FF]"
                  : "bg-[#F5F5F0] hover:bg-[#EBEBE6] text-[#171717] border border-[#171717]/20"
              }`}
            >
              {size}B
            </button>
          ))}
        </div>
      </div>

      {/* 5. VIDEO RESOLUTION */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
            <Film size={13} className="text-[#2457FF]" />
            <span>Video Resolution</span>
          </label>
          <span className="font-mono text-xs font-bold text-[#2457FF]">
            {BITRATE_MBPS[config.quality]} Mbps
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {qualities.map((q) => (
            <button
              key={q}
              onClick={() => onChangeConfig({ quality: q })}
              className={`py-2 rounded font-mono text-xs font-bold transition-all cursor-pointer ${
                config.quality === q
                  ? "bg-[#D7FF38] text-[#171717] font-extrabold border border-[#171717] shadow-[2px_2px_0_#171717]"
                  : "bg-[#F5F5F0] hover:bg-[#EBEBE6] text-[#171717] border border-[#171717]/20"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* 6. COLLAPSIBLE ADVANCED HARDWARE KNOBS (NO EMOJIS) */}
      <div className="pt-2 border-t border-[#171717]/10">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-xs font-mono font-bold text-[#171717] bg-[#F5F5F0] hover:bg-[#EBEBE6] p-2.5 rounded border border-[#171717] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <Sliders size={13} />
            <span>Advanced Hardware Tuning</span>
          </span>
          <span className="text-[10px] text-[#525252]">
            {showAdvanced ? "Hide Tuning" : "Show (Associativity, Capacity)"}
          </span>
        </button>

        {showAdvanced && (
          <div className="space-y-4 pt-3">
            {/* Cache Size */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[11px] font-bold uppercase text-[#171717]">
                  Cache Capacity
                </label>
                <span className="font-mono text-[11px] font-bold text-[#2457FF]">
                  {config.cacheSizeKB} KB
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {cacheSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => onChangeConfig({ cacheSizeKB: size })}
                    className={`py-1 rounded font-mono text-[11px] transition-all cursor-pointer ${
                      config.cacheSizeKB === size
                        ? "bg-[#171717] text-[#D7FF38] font-bold shadow-[1px_1px_0_#2457FF]"
                        : "bg-[#FFFFFF] text-[#171717] border border-[#171717]/20 hover:border-[#171717]"
                    }`}
                  >
                    {size}K
                  </button>
                ))}
              </div>
            </div>

            {/* Set Associativity */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[11px] font-bold uppercase text-[#171717]">
                  Associativity
                </label>
                <span className="font-mono text-[11px] text-[#525252]">
                  {config.associativity === 1 ? "Direct" : `${config.associativity}-Way`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {associativities.map((assoc) => (
                  <button
                    key={assoc.val}
                    onClick={() => onChangeConfig({ associativity: assoc.val })}
                    className={`py-1 rounded font-mono text-[11px] transition-all cursor-pointer ${
                      config.associativity === assoc.val
                        ? "bg-[#171717] text-[#D7FF38] font-bold shadow-[1px_1px_0_#2457FF]"
                        : "bg-[#FFFFFF] text-[#171717] border border-[#171717]/20 hover:border-[#171717]"
                    }`}
                  >
                    {assoc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Replacement Policy */}
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase text-[#171717] block">
                Eviction Policy
              </label>
              <div className="grid grid-cols-3 gap-1">
                {replacements.map((r) => (
                  <button
                    key={r}
                    onClick={() => onChangeConfig({ replacement: r })}
                    className={`py-1 rounded font-mono text-[11px] transition-all cursor-pointer ${
                      config.replacement === r
                        ? "bg-[#171717] text-[#D7FF38] font-bold shadow-[1px_1px_0_#2457FF]"
                        : "bg-[#FFFFFF] text-[#171717] border border-[#171717]/20 hover:border-[#171717]"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Stream Pattern */}
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase text-[#171717] block">
                Playback Pattern
              </label>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => onChangeConfig({ accessPattern: "sequential", seekFrequency: 0.05 })}
                  className={`py-1 rounded font-mono text-[11px] transition-all cursor-pointer ${
                    config.accessPattern === "sequential"
                      ? "bg-[#171717] text-[#D7FF38] font-bold shadow-[1px_1px_0_#2457FF]"
                      : "bg-[#FFFFFF] text-[#171717] border border-[#171717]/20 hover:border-[#171717]"
                  }`}
                >
                  Sequential
                </button>
                <button
                  onClick={() => onChangeConfig({ accessPattern: "seeking", seekFrequency: 0.45 })}
                  className={`py-1 rounded font-mono text-[11px] transition-all cursor-pointer ${
                    config.accessPattern === "seeking"
                      ? "bg-[#171717] text-[#D7FF38] font-bold shadow-[1px_1px_0_#2457FF]"
                      : "bg-[#FFFFFF] text-[#171717] border border-[#171717]/20 hover:border-[#171717]"
                  }`}
                >
                  Seeking
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
