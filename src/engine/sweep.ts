import {
  SimConfig,
  SweepResult,
  AnalysisSummary,
  BlockSizeB,
  TransferMode,
} from "./types";
import { Simulation } from "./simulation";

export const BLOCK_SIZES: BlockSizeB[] = [16, 32, 64, 128, 256];
export const TRANSFER_MODES: TransferMode[] = ["CPU", "DMA"];

export class SweepEngine {
  /**
   * Runs a parameter sweep across all block sizes x transfer modes
   * using the exact same PRNG seed for fairness.
   */
  public static runSweep(
    baseConfig: SimConfig,
    numAccesses: number = 2000,
    onProgress?: (pct: number) => void
  ): SweepResult[] {
    const results: SweepResult[] = [];
    const totalCombinations = BLOCK_SIZES.length * TRANSFER_MODES.length;
    let completed = 0;

    for (const blockSize of BLOCK_SIZES) {
      for (const mode of TRANSFER_MODES) {
        const sim = new Simulation({
          ...baseConfig,
          blockSizeB: blockSize,
          transferMode: mode,
          seed: baseConfig.seed,
        });

        // Run accesses
        sim.step(numAccesses);
        const m = sim.getMetrics();

        // Score: lower AMAT is better, higher CPU free is better
        const score = m.amat * 10 - m.cpuUtilizationFree * 0.5;

        results.push({
          blockSizeB: blockSize,
          transferMode: mode,
          hitRatio: m.hitRatio,
          missRatio: m.missRatio,
          amat: m.amat,
          cpi: m.cpi,
          cpuUtilizationFree: m.cpuUtilizationFree,
          isBuffering: m.isBuffering,
          score,
        });

        completed++;
        if (onProgress) {
          onProgress(Math.round((completed / totalCombinations) * 100));
        }
      }
    }

    return results;
  }

  /**
   * Evaluates the sweep results to identify the optimal configuration
   * and generates academic viva-ready explanations.
   */
  public static analyze(
    results: SweepResult[],
    quality: string
  ): AnalysisSummary {
    if (results.length === 0) {
      return {
        bestConfig: { blockSizeB: 64, transferMode: "DMA" },
        summary: "Default configuration optimal.",
        reasons: [],
      };
    }

    // Sort by lowest AMAT; tie-break on highest CPU Free
    const sorted = [...results].sort((a, b) => {
      if (Math.abs(a.amat - b.amat) > 0.05) {
        return a.amat - b.amat;
      }
      return b.cpuUtilizationFree - a.cpuUtilizationFree;
    });

    const best = sorted[0];

    const reasons: string[] = [
      `At ${best.blockSizeB} Bytes, the block size strikes the ideal balance on the U-shaped AMAT curve: it amortizes compulsory misses over sequential video frames without incurring the bus-penalty of larger blocks.`,
      best.transferMode === "DMA"
        ? `Direct Memory Access (DMA) offloads frame transport to dedicated hardware, freeing ${best.cpuUtilizationFree}% of CPU cycles for H.264/HEVC decoding.`
        : `CPU-driven mode delivers acceptable throughput for lighter streams, but DMA is strongly recommended for sustained 1080p/4K.`,
      `Achieves an Average Memory Access Time of only ${best.amat} cycles with a ${best.hitRatio}% cache hit ratio.`
    ];

    const summary = `${best.blockSizeB} B blocks with ${best.transferMode} mode provide the lowest AMAT (${best.amat} cycles) and leave ${best.cpuUtilizationFree}% of the CPU free for ${quality} streaming.`;

    return {
      bestConfig: {
        blockSizeB: best.blockSizeB,
        transferMode: best.transferMode,
      },
      summary,
      reasons,
    };
  }
}
