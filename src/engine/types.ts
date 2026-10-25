export type CacheSizeKB = 4 | 8 | 16 | 32 | 64;
export type BlockSizeB = 16 | 32 | 64 | 128 | 256;
export type Associativity = 1 | 2 | 4 | 8;
export type ReplacementPolicy = "LRU" | "FIFO" | "Random";
export type TransferMode = "CPU" | "DMA";
export type VideoQuality = "480p" | "720p" | "1080p" | "4K";
export type AccessPattern = "sequential" | "seeking";

export interface SimConfig {
  cacheSizeKB: CacheSizeKB;
  blockSizeB: BlockSizeB;
  associativity: Associativity;
  replacement: ReplacementPolicy;
  transferMode: TransferMode;
  quality: VideoQuality;
  accessPattern: AccessPattern;
  seekFrequency: number; // 0..1, default 0.05
  hitTimeCycles: number; // default 1
  memLatencyCycles: number; // default 80
  busWidthB: number; // default 8
  cyclesPerBusTransfer: number; // default 4
  baseCPI: number; // default 1.0
  memAccessPerInstr: number; // default 0.3
  memoryBandwidthMBps: number; // default 800
  seed: number;
}

export interface CacheGeometry {
  offsetBits: number;
  numBlocks: number;
  numSets: number;
  indexBits: number;
  tagBits: number;
}

export interface SimStep {
  address: number;
  hexAddress: string;
  tag: number;
  setIndex: number;
  offset: number;
  hit: boolean;
  evictedTag?: number;
  cycle: number;
  isTableAccess?: boolean;
}

export interface SimMetrics {
  accessCount: number;
  hitCount: number;
  missCount: number;
  hitRatio: number;
  missRatio: number;
  missPenalty: number;
  amat: number;
  cpi: number;
  stallCycles: number;
  cpuUtilizationFree: number;
  throughputMBps: number;
  bufferLevelPct: number;
  isBuffering: boolean;
  fps: number;
  frameCounter: number;
  cpuCopiedWords: number;
  dmaTransfers: number;
}

export interface SweepResult {
  blockSizeB: BlockSizeB;
  transferMode: TransferMode;
  hitRatio: number;
  missRatio: number;
  amat: number;
  cpi: number;
  cpuUtilizationFree: number;
  isBuffering: boolean;
  score: number;
}

export interface AnalysisSummary {
  bestConfig: {
    blockSizeB: BlockSizeB;
    transferMode: TransferMode;
  };
  summary: string;
  reasons: string[];
}
