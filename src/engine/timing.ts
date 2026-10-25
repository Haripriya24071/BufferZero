import { SimConfig, VideoQuality, TransferMode } from "./types";

export const BITRATE_MBPS: Record<VideoQuality, number> = {
  "480p": 1.5,
  "720p": 3.0,
  "1080p": 6.0,
  "4K": 20.0,
};

// Base decode load fraction required for H.264/HEVC decoding
export const DECODE_LOAD_FRACTION: Record<VideoQuality, number> = {
  "480p": 0.12,
  "720p": 0.20,
  "1080p": 0.32,
  "4K": 0.65,
};

// System clock frequency: 2.0 GHz
export const CPU_HZ = 2.0e9;

export class TimingModel {
  /**
   * Computes the miss penalty in cycles based on block size and memory bus bandwidth:
   * missPenalty = memLatencyCycles + (blockSizeB / busWidthB) * cyclesPerBusTransfer
   */
  public static calculateMissPenalty(
    blockSizeB: number,
    busWidthB: number = 8,
    memLatencyCycles: number = 80,
    cyclesPerBusTransfer: number = 4
  ): number {
    const busTransfers = blockSizeB / busWidthB;
    return memLatencyCycles + busTransfers * cyclesPerBusTransfer;
  }

  /**
   * AMAT = Hit Time + (Miss Rate * Miss Penalty)
   */
  public static calculateAMAT(
    hitRatio: number,
    missPenalty: number,
    hitTimeCycles: number = 1
  ): number {
    const missRatio = Math.max(0, 1 - hitRatio);
    return hitTimeCycles + missRatio * missPenalty;
  }

  /**
   * CPI = Base CPI + (Mem Accesses / Instruction * Miss Rate * Miss Penalty)
   */
  public static calculateCPI(
    baseCPI: number,
    memAccessPerInstr: number,
    missRatio: number,
    missPenalty: number
  ): { cpi: number; stallCyclesPerInstr: number } {
    const stallCyclesPerInstr = memAccessPerInstr * missRatio * missPenalty;
    const cpi = baseCPI + stallCyclesPerInstr;
    return { cpi, stallCyclesPerInstr };
  }

  /**
   * Calculates CPU Utilization and Free CPU %:
   * Compares Programmed I/O (CPU word-by-word copy) vs. DMA (Hardware Controller + Cycle Stealing).
   */
  public static calculateCpuUtilization(
    config: SimConfig,
    missRatio: number,
    missPenalty: number
  ): {
    cpuUtilizationFree: number;
    cpuBusyTransferPct: number;
    cpuBusyDecodePct: number;
    cpuStallPct: number;
    cpuCopiedWords: number;
    dmaTransfers: number;
  } {
    const bitrate = BITRATE_MBPS[config.quality];
    const bytesPerSec = (bitrate * 1e6) / 8;
    const wordsPerSec = bytesPerSec / 4;
    const decodeFraction = DECODE_LOAD_FRACTION[config.quality];

    let transferCyclesPerSec = 0;
    let cpuCopiedWords = 0;
    let dmaTransfers = 0;
    let cpuBusyTransferPct = 0;
    const cpuBusyDecodePct = decodeFraction * 100;

    if (config.transferMode === "CPU") {
      // Programmed I/O: CPU must execute instruction copy loop (read from I/O port, write to RAM)
      // plus interrupt overhead per network chunk, consuming major CPU cycles (~35-65% at 1080p/4K)
      const baseCopyOverheadPct = (bitrate / 6.0) * 35;
      cpuBusyTransferPct = Math.min(65, Math.max(15, baseCopyOverheadPct));
      cpuCopiedWords = Math.round(wordsPerSec);
    } else {
      // DMA Mode: Dedicated hardware controller offloads block copy.
      // CPU only pays minor setup overhead + bus cycle stealing (~2-5%)
      const dmaOverheadPct = 2.5 + (bitrate / 20.0) * 3.5;
      cpuBusyTransferPct = dmaOverheadPct;
      const blocksPerSec = bytesPerSec / config.blockSizeB;
      dmaTransfers = Math.round(blocksPerSec);
    }

    // Memory stalls effect
    const cpuStallPct = Math.min(30, (missRatio * missPenalty * 0.15));

    const totalBusyPct = Math.min(100, cpuBusyTransferPct + cpuBusyDecodePct + cpuStallPct);
    const cpuUtilizationFree = Math.max(0, 100 - totalBusyPct);

    return {
      cpuUtilizationFree,
      cpuBusyTransferPct,
      cpuBusyDecodePct,
      cpuStallPct,
      cpuCopiedWords,
      dmaTransfers,
    };
  }

  /**
   * Achieved throughput given memory bandwidth and AMAT-driven slowdown
   */
  public static calculateThroughput(
    config: SimConfig,
    amat: number
  ): number {
    const theoreticalMBps = config.memoryBandwidthMBps;
    // Slowdown factor increases as AMAT increases above baseline 1.0 cycle
    const amatFactor = Math.max(1, amat / 1.0);
    const modePenalty = config.transferMode === "CPU" ? 0.45 : 0.95;
    const throughput = (theoreticalMBps / Math.sqrt(amatFactor)) * modePenalty;
    return Math.min(theoreticalMBps, Math.max(0.5, throughput));
  }
}
