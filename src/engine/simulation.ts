import {
  SimConfig,
  SimMetrics,
  SimStep,
  BlockSizeB,
  CacheSizeKB,
  Associativity,
  ReplacementPolicy,
  TransferMode,
  VideoQuality,
  AccessPattern,
} from "./types";
import { CacheModel } from "./cache";
import { AddressStream } from "./addressStream";
import { TimingModel } from "./timing";
import { BufferDynamics } from "./buffer";

export const DEFAULT_CONFIG: SimConfig = {
  cacheSizeKB: 16,
  blockSizeB: 64,
  associativity: 4,
  replacement: "LRU",
  transferMode: "DMA",
  quality: "1080p",
  accessPattern: "sequential",
  seekFrequency: 0.05,
  hitTimeCycles: 1,
  memLatencyCycles: 80,
  busWidthB: 8,
  cyclesPerBusTransfer: 4,
  baseCPI: 1.0,
  memAccessPerInstr: 0.3,
  memoryBandwidthMBps: 800,
  seed: 42,
};

export class Simulation {
  public config: SimConfig;
  public cache: CacheModel;
  public addressStream: AddressStream;
  public buffer: BufferDynamics;

  private accessCount: number = 0;
  private hitCount: number = 0;
  private missCount: number = 0;

  // History buffer for the Rewind Debugger (last 200 steps)
  public history: SimStep[] = [];
  private maxHistory: number = 200;

  constructor(initialConfig: Partial<SimConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...initialConfig };
    this.cache = new CacheModel(
      this.config.cacheSizeKB,
      this.config.blockSizeB,
      this.config.associativity,
      this.config.replacement,
      this.config.seed
    );
    this.addressStream = new AddressStream(
      this.config.quality,
      this.config.accessPattern,
      this.config.seekFrequency,
      this.config.seed
    );
    this.buffer = new BufferDynamics();
  }

  public reset(): void {
    this.accessCount = 0;
    this.hitCount = 0;
    this.missCount = 0;
    this.history = [];
    this.cache.reset();
    this.addressStream.reset(this.config.seed);
    this.buffer.reset();
  }

  public setConfig(partial: Partial<SimConfig>): void {
    this.config = { ...this.config, ...partial };
    this.cache.reconfigure(
      this.config.cacheSizeKB,
      this.config.blockSizeB,
      this.config.associativity,
      this.config.replacement
    );
    this.addressStream.updateConfig(
      this.config.quality,
      this.config.accessPattern,
      this.config.seekFrequency
    );
  }

  /**
   * Advances simulation by N memory accesses.
   * Returns batch of SimSteps for the UI.
   */
  public step(n: number = 1): SimStep[] {
    const steps: SimStep[] = [];

    for (let i = 0; i < n; i++) {
      const { address, isTableAccess } = this.addressStream.nextAddress();
      const step = this.cache.access(address, isTableAccess);

      this.accessCount++;
      if (step.hit) {
        this.hitCount++;
      } else {
        this.missCount++;
      }

      steps.push(step);

      // Record in Rewind Debugger history
      this.history.push(step);
      if (this.history.length > this.maxHistory) {
        this.history.shift();
      }
    }

    // Update buffer dynamics
    const metrics = this.getMetrics();
    this.buffer.update(
      this.config.quality,
      this.config.transferMode,
      metrics.throughputMBps,
      metrics.cpuUtilizationFree,
      0.05
    );

    return steps;
  }

  /**
   * Computes live performance metrics.
   */
  public getMetrics(): SimMetrics {
    const hitRatio =
      this.accessCount > 0 ? this.hitCount / this.accessCount : 0.92;
    const missRatio = Math.max(0, 1 - hitRatio);

    const missPenalty = TimingModel.calculateMissPenalty(
      this.config.blockSizeB,
      this.config.busWidthB,
      this.config.memLatencyCycles,
      this.config.cyclesPerBusTransfer
    );

    const amat = TimingModel.calculateAMAT(
      hitRatio,
      missPenalty,
      this.config.hitTimeCycles
    );

    const { cpi, stallCyclesPerInstr } = TimingModel.calculateCPI(
      this.config.baseCPI,
      this.config.memAccessPerInstr,
      missRatio,
      missPenalty
    );

    const cpuMetrics = TimingModel.calculateCpuUtilization(
      this.config,
      missRatio,
      missPenalty
    );

    const throughputMBps = TimingModel.calculateThroughput(this.config, amat);

    return {
      accessCount: this.accessCount,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRatio: Math.round(hitRatio * 1000) / 10,
      missRatio: Math.round(missRatio * 1000) / 10,
      missPenalty: Math.round(missPenalty),
      amat: Math.round(amat * 100) / 100,
      cpi: Math.round(cpi * 100) / 100,
      stallCycles: Math.round(stallCyclesPerInstr * 100) / 100,
      cpuUtilizationFree: Math.round(cpuMetrics.cpuUtilizationFree * 10) / 10,
      throughputMBps: Math.round(throughputMBps * 10) / 10,
      bufferLevelPct: this.buffer.bufferLevelPct,
      isBuffering: this.buffer.isBuffering,
      fps: this.buffer.fps,
      frameCounter: this.buffer.frameCounter,
      cpuCopiedWords: cpuMetrics.cpuCopiedWords,
      dmaTransfers: cpuMetrics.dmaTransfers,
    };
  }

  // --- Break-It Stress Actions ---
  public triggerSeekStorm(): void {
    this.setConfig({ accessPattern: "seeking", seekFrequency: 0.6 });
    this.step(30);
    this.buffer.drainBuffer(25);
  }

  public triggerColdFlush(): void {
    this.cache.reset();
    this.step(15);
    this.buffer.drainBuffer(35);
  }

  public triggerNetworkBurst(): void {
    if (this.config.transferMode === "CPU") {
      this.buffer.drainBuffer(40);
    } else {
      this.buffer.fillBuffer(20);
    }
  }
}
