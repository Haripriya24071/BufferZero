import { PRNG } from "./prng";
import { VideoQuality, AccessPattern } from "./types";

/**
 * Quality-based video buffer memory sizes in bytes:
 * 480p:  ~4 MB region
 * 720p:  ~8 MB region
 * 1080p: ~16 MB region
 * 4K:    ~64 MB region
 */
const BUFFER_REGIONS: Record<VideoQuality, number> = {
  "480p": 4 * 1024 * 1024,
  "720p": 8 * 1024 * 1024,
  "1080p": 16 * 1024 * 1024,
  "4K": 64 * 1024 * 1024,
};

// Decoder table region (small 8KB region, repeatedly touched for temporal locality)
const DECODER_TABLE_BASE = 0x10000000;
const DECODER_TABLE_SIZE = 8 * 1024;

// Base address for video streaming frame buffer in memory
const VIDEO_STREAM_BASE = 0x20000000;

export class AddressStream {
  private prng: PRNG;
  private currentVideoAddr: number;
  private regionSize: number;
  private accessPattern: AccessPattern;
  private seekFrequency: number;
  private accessStep: number = 4; // 4-byte (32-bit word) access
  private accessesSinceCheck: number = 0;

  constructor(
    quality: VideoQuality = "1080p",
    accessPattern: AccessPattern = "sequential",
    seekFrequency: number = 0.05,
    seed: number = 42
  ) {
    this.prng = new PRNG(seed);
    this.regionSize = BUFFER_REGIONS[quality];
    this.currentVideoAddr = VIDEO_STREAM_BASE;
    this.accessPattern = accessPattern;
    this.seekFrequency = seekFrequency;
  }

  public reset(seed: number = 42): void {
    this.prng.setSeed(seed);
    this.currentVideoAddr = VIDEO_STREAM_BASE;
    this.accessesSinceCheck = 0;
  }

  public updateConfig(
    quality: VideoQuality,
    pattern: AccessPattern,
    seekFrequency: number
  ): void {
    this.regionSize = BUFFER_REGIONS[quality];
    this.accessPattern = pattern;
    this.seekFrequency = seekFrequency;
  }

  /**
   * Generates the next 32-bit address.
   * Approx 10% of accesses hit the decoder metadata table (high temporal locality).
   * 90% of accesses stream video frames (sequential + seeking).
   */
  public nextAddress(): { address: number; isTableAccess: boolean } {
    this.accessesSinceCheck++;

    // 10% chance of accessing decoder lookup tables / Huffman tables
    if (this.prng.next() < 0.10) {
      const tableOffset = (this.prng.nextInt(0, (DECODER_TABLE_SIZE / 4) - 1)) * 4;
      return {
        address: (DECODER_TABLE_BASE + tableOffset) >>> 0,
        isTableAccess: true,
      };
    }

    // Video stream access
    if (this.accessPattern === "seeking" || this.prng.next() < this.seekFrequency) {
      // Jump to a random 64-byte aligned boundary in the buffer
      const randomChunk = this.prng.nextInt(0, Math.floor(this.regionSize / 64) - 1);
      this.currentVideoAddr = (VIDEO_STREAM_BASE + randomChunk * 64) >>> 0;
    } else {
      // Sequential streaming forward
      this.currentVideoAddr = (this.currentVideoAddr + this.accessStep) >>> 0;
      if (this.currentVideoAddr >= VIDEO_STREAM_BASE + this.regionSize) {
        this.currentVideoAddr = VIDEO_STREAM_BASE;
      }
    }

    return {
      address: this.currentVideoAddr >>> 0,
      isTableAccess: false,
    };
  }
}
