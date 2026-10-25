import { VideoQuality, TransferMode } from "./types";
import { BITRATE_MBPS } from "./timing";

export class BufferDynamics {
  public bufferLevelPct: number = 75; // starts comfortably buffered
  public isBuffering: boolean = false;
  public frameCounter: number = 0;
  public fps: number = 60;

  constructor() {
    this.bufferLevelPct = 75;
    this.isBuffering = false;
    this.frameCounter = 0;
    this.fps = 60;
  }

  public reset(initialPct: number = 75): void {
    this.bufferLevelPct = initialPct;
    this.isBuffering = false;
    this.frameCounter = 0;
    this.fps = 60;
  }

  /**
   * Updates buffer level according to delivery vs playback rate with 0% -> 30% hysteresis.
   * dt: delta time in seconds (e.g. 0.05s per tick)
   */
  public update(
    quality: VideoQuality,
    transferMode: TransferMode,
    throughputMBps: number,
    cpuUtilizationFree: number,
    dt: number = 0.05
  ): { bufferLevelPct: number; isBuffering: boolean; fps: number; frameCounter: number } {
    const requiredBitrateMbps = BITRATE_MBPS[quality];
    const playbackRateMBps = requiredBitrateMbps / 8; // convert Mbps to MB/s

    // Delivered rate is bounded by sustained system throughput
    let effectiveDeliveryRate = throughputMBps * 0.15; // delivery fraction scaled to simulation time

    // If CPU is starved (CPU Free < 10%), decode pipeline cannot consume buffers efficiently
    if (cpuUtilizationFree < 10) {
      effectiveDeliveryRate *= Math.max(0.05, cpuUtilizationFree / 10);
    }

    // In CPU mode on high resolutions (1080p/4K), severe copy bottleneck drains buffer
    if (transferMode === "CPU" && (quality === "1080p" || quality === "4K")) {
      effectiveDeliveryRate *= 0.65;
    }

    const netChange = (effectiveDeliveryRate - playbackRateMBps) * dt * 25;
    this.bufferLevelPct = Math.min(100, Math.max(0, this.bufferLevelPct + netChange));

    // Hysteresis logic:
    // If buffer drops to 0, video freezes and triggers buffering stall
    if (this.bufferLevelPct <= 0) {
      this.isBuffering = true;
      this.bufferLevelPct = 0;
    }

    // Remain in buffering state until buffer refills past 30% threshold
    if (this.isBuffering) {
      if (this.bufferLevelPct >= 30) {
        this.isBuffering = false;
      }
    }

    // Update FPS and Frame counter
    if (this.isBuffering) {
      this.fps = Math.max(0, Math.floor(Math.random() * 5));
    } else {
      // Normal playback at ~60 FPS (or slight jitter if CPU is heavy)
      const cpuFactor = Math.min(1, cpuUtilizationFree / 30);
      this.fps = Math.round(55 + 5 * cpuFactor);
      this.frameCounter++;
    }

    return {
      bufferLevelPct: Math.round(this.bufferLevelPct * 10) / 10,
      isBuffering: this.isBuffering,
      fps: this.fps,
      frameCounter: this.frameCounter,
    };
  }

  // Stress tests: Break-it triggers
  public drainBuffer(dropAmountPct: number = 40): void {
    this.bufferLevelPct = Math.max(0, this.bufferLevelPct - dropAmountPct);
    if (this.bufferLevelPct <= 0) {
      this.isBuffering = true;
    }
  }

  public fillBuffer(amountPct: number = 50): void {
    this.bufferLevelPct = Math.min(100, this.bufferLevelPct + amountPct);
    if (this.bufferLevelPct >= 30) {
      this.isBuffering = false;
    }
  }
}
