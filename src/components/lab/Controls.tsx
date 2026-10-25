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
import { Sliders, HelpCircle, HardDrive, Cpu, Radio, Film, Flame, Swords } from "lucide-react";

interface ControlsProps {
  config: SimConfig;
  onChangeConfig: (partial: Partial<SimConfig>) => void;
  onResetDefaults: () => void;
  onSeekStorm?: () => void;
  onColdFlush?: () => void;
  onNetworkBurst?: () => void;
  activePreset?: string;
  onSelectPreset?: (presetName: string) => void;
  isRaceMode?: boolean;
  onToggleRaceMode?: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  config,
  onChangeConfig,
  onResetDefaults,
  onSeekStorm,
  onColdFlush,
  onNetworkBurst,
  activePreset = "balanced",
  onSelectPreset,
  isRaceMode,
  onToggleRaceMode,
}) => {
  const [showAdvanced, setShowAdvanced] = React.useState<boolean>(false);

  const presets = [
    {
      id: "balanced",
      label: "Balanced (1080p)",
      sub: "1080p • 16KB • DMA",
      tooltip: "Optimal sweet spot for everyday 1080p streaming with DMA hardware transfer",
    },
    {
      id: "phone",
      label: "Phone (480p)",
      sub: "480p • 8KB • DMA",
      tooltip: "Low-power mobile tier with compact cache footprint",
    },
    {
      id: "weak_4k",
      label: "Weak Device (4K)",
      sub: "4K • 4KB • CPU Copy",
      tooltip: "Stresses CPU-driven word copying under heavy 4K bitrates, exposing stall bottlenecks",
    },
    {
      id: "scrubbing",
      label: "Seek Scrubbing",
      sub: "1080p • Seeking Storm",
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
    <div className="card-tactile p-5 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#171717]/10">
        <div className="flex items-center gap-2">
          <Sliders size={18} className="text-[#171717]" />
          <h3 className="font-display text-lg text-[#171717]">Architecture Controls</h3>
        </div>
        <div className="flex items-center gap-2">
          {onToggleRaceMode && (
            <button
              onClick={onToggleRaceMode}
              className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 shadow-xs ${
                isRaceMode
                  ? "bg-[#2457FF] text-white border-[#171717]"
                  : "bg-[#171717] text-[#D7FF38] border-[#171717] hover:bg-[#262626]"
              }`}
              title="Launch Dual-Architecture Race Mode (CPU vs DMA)"
            >
              <Swords size={12} />
              <span>{isRaceMode ? "Exit Race" : "Race Mode"}</span>
            </button>
          )}
          <button
            onClick={onResetDefaults}
            className="text-[11px] font-mono text-[#525252] hover:text-[#2457FF] underline cursor-pointer"
          >
            Reset Defaults
          </button>
        </div>
      </div>

      {/* 0. Workload Presets Quick-Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
            <Sliders size={13} className="text-[#2457FF]" />
            <span>Workload Presets</span>
          </label>
          <span className="text-[10px] font-mono text-[#525252]">
            Preconfigured Profiles
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectPreset?.(p.id)}
              className={`p-2 rounded-lg text-left font-mono transition-all cursor-pointer flex flex-col gap-0.5 ${
                activePreset === p.id
                  ? "bg-[#171717] text-[#D7FF38] border-2 border-[#171717] shadow-[2px_2px_0_#2457FF]"
                  : "bg-[#F5F5F0] hover:bg-[#EBEBE6] text-[#171717] border border-[#171717]/20"
              }`}
              title={p.tooltip}
            >
              <span className="text-xs font-bold leading-tight">{p.label}</span>
              <span className="text-[9px] opacity-80 leading-none">{p.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 1. Big Two-State Transfer Mode Switch (CPU vs DMA) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
            <Radio size={13} className="text-[#2457FF]" />
            <span>Data Transfer Architecture</span>
          </label>
          <span className="text-[10px] font-mono text-[#525252]">
            {config.transferMode === "DMA" ? "Dedicated Hardware" : "Programmed I/O"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#F5F5F0] border-2 border-[#171717] rounded-lg">
          <button
            onClick={() => onChangeConfig({ transferMode: "CPU" })}
            className={`py-2 px-3 rounded font-mono text-xs font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
              config.transferMode === "CPU"
                ? "bg-[#FF3B30] text-white shadow-[2px_2px_0_#171717] border border-[#171717]"
                : "text-[#171717] hover:bg-[#EBEBE6]"
            }`}
          >
            <span>CPU-DRIVEN</span>
            <span className="text-[9px] font-normal opacity-90">6 cycles/word copy</span>
          </button>

          <button
            onClick={() => onChangeConfig({ transferMode: "DMA" })}
            className={`py-2 px-3 rounded font-mono text-xs font-bold transition-all flex flex-col items-center gap-0.5 cursor-pointer ${
              config.transferMode === "DMA"
                ? "bg-[#2457FF] text-white shadow-[2px_2px_0_#171717] border border-[#171717]"
                : "text-[#171717] hover:bg-[#EBEBE6]"
            }`}
          >
            <span>DMA CONTROLLER</span>
            <span className="text-[9px] font-normal opacity-90">Hardware Offloaded</span>
          </button>
        </div>
      </div>

      {/* 2. Block Size Slider with Growth Visualizer */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
            <HardDrive size={13} className="text-[#2457FF]" />
            <span>Cache Block Size (L1 Line)</span>
          </label>
          <div className="flex items-center gap-2">
            <div
              className="h-4 bg-[#D7FF38] border border-[#171717] rounded-xs transition-all duration-200"
              style={{ width: `${blockSizeBoxWidth}px` }}
              title={`Block Size: ${config.blockSizeB} Bytes`}
            ></div>
            <span className="font-mono text-xs font-extrabold text-[#171717] bg-[#D7FF38] px-1.5 py-0.5 rounded border border-[#171717]">
              {config.blockSizeB} B
            </span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1">
          {blockSizes.map((size) => (
            <button
              key={size}
              onClick={() => onChangeConfig({ blockSizeB: size })}
              className={`py-1.5 rounded font-mono text-xs transition-all cursor-pointer ${
                config.blockSizeB === size
                  ? "bg-[#171717] text-[#D7FF38] font-bold shadow-[2px_2px_0_#2457FF]"
                  : "bg-[#F5F5F0] hover:bg-[#EBEBE6] text-[#171717] border border-[#171717]/20"
              }`}
            >
              {size}B
            </button>
          ))}
        </div>
        <p className="text-[10px] font-mono text-[#525252]">
          Small blocks cause misses; huge blocks balloon bus fill time.
        </p>
      </div>

      {/* 3. Video Stream Quality */}
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

        <div className="grid grid-cols-4 gap-1">
          {qualities.map((q) => (
            <button
              key={q}
              onClick={() => onChangeConfig({ quality: q })}
              className={`py-1.5 rounded font-mono text-xs transition-all cursor-pointer ${
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

      {/* 4. Hardware Stress Scenarios */}
      {onSeekStorm && onColdFlush && onNetworkBurst && (
        <div className="space-y-1.5 pt-2 border-t border-[#171717]/10">
          <div className="flex items-center justify-between">
            <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
              <Flame size={13} className="text-[#FF3B30]" />
              <span>Stress Triggers</span>
            </label>
            <span className="text-[9px] font-mono text-[#525252]">Edge Cases</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={onSeekStorm}
              className="py-1.5 px-2 rounded font-mono text-xs font-bold border-2 border-[#171717] bg-[#F5F5F0] hover:bg-[#EBEBE6] shadow-[2px_2px_0_#171717] active:translate-y-0.5 text-center transition-all cursor-pointer"
              title="Forces sudden video scrubbing. Tests spatial cache thrashing."
            >
              🌪️ Seek
            </button>
            <button
              onClick={onColdFlush}
              className="py-1.5 px-2 rounded font-mono text-xs font-bold border-2 border-[#171717] bg-[#F5F5F0] hover:bg-[#EBEBE6] shadow-[2px_2px_0_#171717] active:translate-y-0.5 text-center transition-all cursor-pointer"
              title="Invalidates all cache lines. Tests compulsory miss latency."
            >
              ❄️ Flush
            </button>
            <button
              onClick={onNetworkBurst}
              className="py-1.5 px-2 rounded font-mono text-xs font-bold border-2 border-[#171717] bg-[#2457FF] hover:bg-[#1A46E0] text-white shadow-[2px_2px_0_#171717] active:translate-y-0.5 text-center transition-all cursor-pointer"
              title="Spikes incoming packet bitrate. Tests DMA vs CPU saturation limit."
            >
              ⚡ Burst
            </button>
          </div>
        </div>
      )}

      {/* Collapsible Advanced Hardware Knobs */}
      <div className="pt-2 border-t border-[#171717]/10">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-xs font-mono font-bold text-[#171717] bg-[#F5F5F0] hover:bg-[#EBEBE6] p-2.5 rounded border border-[#171717] transition-colors cursor-pointer"
        >
          <span>⚙️ Advanced Hardware Tuning</span>
          <span className="text-[10px] text-[#525252]">{showAdvanced ? "▲ Hide" : "▼ Show (Associativity, Capacity)"}</span>
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
