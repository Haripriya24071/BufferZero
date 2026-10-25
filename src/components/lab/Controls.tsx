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
import { Sliders, HelpCircle, HardDrive, Cpu, Radio, Film, Flame } from "lucide-react";

interface ControlsProps {
  config: SimConfig;
  onChangeConfig: (partial: Partial<SimConfig>) => void;
  onResetDefaults: () => void;
  onSeekStorm?: () => void;
  onColdFlush?: () => void;
  onNetworkBurst?: () => void;
}

export const Controls: React.FC<ControlsProps> = ({
  config,
  onChangeConfig,
  onResetDefaults,
  onSeekStorm,
  onColdFlush,
  onNetworkBurst,
}) => {
  const [showAdvanced, setShowAdvanced] = React.useState<boolean>(false);

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
      <div className="flex items-center justify-between pb-3 border-b-2 border-[#12151A]/10">
        <div className="flex items-center gap-2">
          <Sliders size={18} className="text-[#12151A]" />
          <h3 className="font-display text-lg text-[#12151A]">Architecture Controls</h3>
        </div>
        <button
          onClick={onResetDefaults}
          className="text-[11px] font-mono text-[#5A6372] hover:text-[#12151A] underline cursor-pointer"
        >
          Reset Defaults
        </button>
      </div>

      {/* 1. Big Two-State Transfer Mode Switch (CPU vs DMA) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#12151A] flex items-center gap-1.5">
            <Radio size={13} />
            <span>Data Transfer Mode (CO4)</span>
          </label>
          <span className="text-[10px] font-mono text-[#5A6372]">
            {config.transferMode === "DMA" ? "Dedicated Hardware" : "Programmed I/O"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#F5F2EB] border-2 border-[#12151A] rounded-lg">
          <button
            onClick={() => onChangeConfig({ transferMode: "CPU" })}
            className={`py-2 px-3 rounded font-mono text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
              config.transferMode === "CPU"
                ? "bg-[#FF3B30] text-white shadow-[2px_2px_0_#12151A] border border-[#12151A]"
                : "text-[#12151A] hover:bg-[#EAE5DB]"
            }`}
          >
            <span>CPU-DRIVEN</span>
            <span className="text-[9px] font-normal opacity-90">6 cycles/word copy</span>
          </button>

          <button
            onClick={() => onChangeConfig({ transferMode: "DMA" })}
            className={`py-2 px-3 rounded font-mono text-xs font-bold transition-all flex flex-col items-center gap-0.5 ${
              config.transferMode === "DMA"
                ? "bg-[#CCFF00] text-[#12151A] shadow-[2px_2px_0_#12151A] border border-[#12151A]"
                : "text-[#12151A] hover:bg-[#EAE5DB]"
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
          <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#12151A] flex items-center gap-1.5">
            <HardDrive size={13} />
            <span>Cache Block Size (CO5)</span>
          </label>
          <div className="flex items-center gap-2">
            <div
              className="h-4 bg-[#CCFF00] border border-[#12151A] rounded-xs transition-all duration-200"
              style={{ width: `${blockSizeBoxWidth}px` }}
              title={`Block Size: ${config.blockSizeB} Bytes`}
            ></div>
            <span className="font-mono text-xs font-extrabold text-[#12151A] bg-[#CCFF00] px-1.5 py-0.5 rounded border border-[#12151A]">
              {config.blockSizeB} B
            </span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1">
          {blockSizes.map((size) => (
            <button
              key={size}
              onClick={() => onChangeConfig({ blockSizeB: size })}
              className={`py-1.5 rounded font-mono text-xs transition-all ${
                config.blockSizeB === size
                  ? "bg-[#12151A] text-[#CCFF00] font-bold shadow-[2px_2px_0_#12151A]"
                  : "bg-[#F5F2EB] hover:bg-[#EAE5DB] text-[#12151A] border border-[#12151A]/20"
              }`}
            >
              {size}B
            </button>
          ))}
        </div>
        <p className="text-[10px] font-mono text-[#5A6372]">
          Small blocks cause misses; huge blocks balloon bus fill time.
        </p>
      </div>

      {/* 3. Video Stream Quality */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#12151A] flex items-center gap-1.5">
            <Film size={13} />
            <span>Video Resolution</span>
          </label>
          <span className="font-mono text-xs font-bold text-[#12151A]">
            {BITRATE_MBPS[config.quality]} Mbps
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1">
          {qualities.map((q) => (
            <button
              key={q}
              onClick={() => onChangeConfig({ quality: q })}
              className={`py-1.5 rounded font-mono text-xs transition-all ${
                config.quality === q
                  ? "bg-[#CCFF00] text-[#12151A] font-extrabold border border-[#12151A] shadow-[2px_2px_0_#12151A]"
                  : "bg-[#F5F2EB] hover:bg-[#EAE5DB] text-[#12151A] border border-[#12151A]/20"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Hardware Stress Scenarios */}
      {onSeekStorm && onColdFlush && onNetworkBurst && (
        <div className="space-y-1.5 pt-2 border-t border-[#12151A]/10">
          <div className="flex items-center justify-between">
            <label className="font-mono text-xs font-bold uppercase tracking-wider text-[#12151A] flex items-center gap-1.5">
              <Flame size={13} className="text-[#FF3B30]" />
              <span>Stress Triggers</span>
            </label>
            <span className="text-[9px] font-mono text-[#5A6372]">Edge Cases</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={onSeekStorm}
              className="py-1.5 px-2 rounded font-mono text-xs font-bold border-2 border-[#12151A] bg-[#F5F2EB] hover:bg-[#EAE5DB] shadow-[2px_2px_0_#12151A] active:translate-y-0.5 text-center transition-all cursor-pointer"
              title="Forces sudden video scrubbing. Tests spatial cache thrashing."
            >
              🌪️ Seek
            </button>
            <button
              onClick={onColdFlush}
              className="py-1.5 px-2 rounded font-mono text-xs font-bold border-2 border-[#12151A] bg-[#F5F2EB] hover:bg-[#EAE5DB] shadow-[2px_2px_0_#12151A] active:translate-y-0.5 text-center transition-all cursor-pointer"
              title="Invalidates all cache lines. Tests compulsory miss latency."
            >
              ❄️ Flush
            </button>
            <button
              onClick={onNetworkBurst}
              className="py-1.5 px-2 rounded font-mono text-xs font-bold border-2 border-[#12151A] bg-[#CCFF00] hover:bg-[#BBEE00] text-[#12151A] shadow-[2px_2px_0_#12151A] active:translate-y-0.5 text-center transition-all cursor-pointer"
              title="Spikes incoming packet bitrate. Tests DMA vs CPU saturation limit."
            >
              ⚡ Burst
            </button>
          </div>
        </div>
      )}

      {/* Collapsible Advanced Hardware Knobs */}
      <div className="pt-2 border-t border-[#12151A]/10">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-xs font-mono font-bold text-[#12151A] bg-[#F5F2EB] hover:bg-[#EAE5DB] p-2.5 rounded border border-[#12151A] transition-colors"
        >
          <span>⚙️ Advanced Hardware Tuning</span>
          <span className="text-[10px] text-[#5A6372]">{showAdvanced ? "▲ Hide" : "▼ Show (Associativity, Capacity)"}</span>
        </button>

        {showAdvanced && (
          <div className="space-y-4 pt-3">
            {/* Cache Size */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[11px] font-bold uppercase text-[#12151A]">
                  Cache Capacity
                </label>
                <span className="font-mono text-[11px] font-bold text-[#12151A]">
                  {config.cacheSizeKB} KB
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {cacheSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => onChangeConfig({ cacheSizeKB: size })}
                    className={`py-1 rounded font-mono text-[11px] transition-all ${
                      config.cacheSizeKB === size
                        ? "bg-[#12151A] text-white font-bold"
                        : "bg-[#FFFFFF] text-[#12151A] border border-[#12151A]/20"
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
                <label className="font-mono text-[11px] font-bold uppercase text-[#12151A]">
                  Associativity
                </label>
                <span className="font-mono text-[11px] text-[#5A6372]">
                  {config.associativity === 1 ? "Direct" : `${config.associativity}-Way`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {associativities.map((assoc) => (
                  <button
                    key={assoc.val}
                    onClick={() => onChangeConfig({ associativity: assoc.val })}
                    className={`py-1 rounded font-mono text-[11px] transition-all ${
                      config.associativity === assoc.val
                        ? "bg-[#12151A] text-white font-bold"
                        : "bg-[#FFFFFF] text-[#12151A] border border-[#12151A]/20"
                    }`}
                  >
                    {assoc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Replacement Policy */}
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase text-[#12151A] block">
                Eviction Policy
              </label>
              <div className="grid grid-cols-3 gap-1">
                {replacements.map((r) => (
                  <button
                    key={r}
                    onClick={() => onChangeConfig({ replacement: r })}
                    className={`py-1 rounded font-mono text-[11px] transition-all ${
                      config.replacement === r
                        ? "bg-[#12151A] text-white font-bold"
                        : "bg-[#FFFFFF] text-[#12151A] border border-[#12151A]/20"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Stream Pattern */}
            <div className="space-y-1.5">
              <label className="font-mono text-[11px] font-bold uppercase text-[#12151A] block">
                Playback Pattern
              </label>
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => onChangeConfig({ accessPattern: "sequential", seekFrequency: 0.05 })}
                  className={`py-1 rounded font-mono text-[11px] transition-all ${
                    config.accessPattern === "sequential"
                      ? "bg-[#12151A] text-white font-bold"
                      : "bg-[#FFFFFF] text-[#12151A] border border-[#12151A]/20"
                  }`}
                >
                  Sequential
                </button>
                <button
                  onClick={() => onChangeConfig({ accessPattern: "seeking", seekFrequency: 0.45 })}
                  className={`py-1 rounded font-mono text-[11px] transition-all ${
                    config.accessPattern === "seeking"
                      ? "bg-[#12151A] text-white font-bold"
                      : "bg-[#FFFFFF] text-[#12151A] border border-[#12151A]/20"
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
