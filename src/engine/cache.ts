import {
  CacheSizeKB,
  BlockSizeB,
  Associativity,
  ReplacementPolicy,
  CacheGeometry,
  SimStep,
} from "./types";
import { PRNG } from "./prng";

export interface CacheLine {
  valid: boolean;
  tag: number;
  lastUsedCycle: number;
  insertedCycle: number;
}

export class CacheModel {
  public geometry!: CacheGeometry;
  public sets: CacheLine[][] = [];
  private replacement: ReplacementPolicy;
  private prng: PRNG;
  private currentCycle: number = 0;

  constructor(
    cacheSizeKB: CacheSizeKB = 16,
    blockSizeB: BlockSizeB = 64,
    associativity: Associativity = 4,
    replacement: ReplacementPolicy = "LRU",
    seed: number = 42
  ) {
    this.replacement = replacement;
    this.prng = new PRNG(seed);
    this.reconfigure(cacheSizeKB, blockSizeB, associativity, replacement);
  }

  public reconfigure(
    cacheSizeKB: CacheSizeKB,
    blockSizeB: BlockSizeB,
    associativity: Associativity,
    replacement: ReplacementPolicy = this.replacement
  ): CacheGeometry {
    this.replacement = replacement;
    const totalBytes = cacheSizeKB * 1024;
    let numBlocks = Math.floor(totalBytes / blockSizeB);

    // Clamp associativity if it exceeds total block count
    const safeAssoc = Math.min(associativity, numBlocks);
    const numSets = Math.max(1, Math.floor(numBlocks / safeAssoc));

    const offsetBits = Math.round(Math.log2(blockSizeB));
    const indexBits = Math.round(Math.log2(numSets));
    const tagBits = 32 - indexBits - offsetBits;

    this.geometry = {
      offsetBits,
      numBlocks,
      numSets,
      indexBits,
      tagBits,
    };

    // Reinitialize sets
    this.sets = new Array(numSets);
    for (let s = 0; s < numSets; s++) {
      this.sets[s] = [];
      for (let w = 0; w < safeAssoc; w++) {
        this.sets[s].push({
          valid: false,
          tag: 0,
          lastUsedCycle: 0,
          insertedCycle: 0,
        });
      }
    }

    this.currentCycle = 0;
    return this.geometry;
  }

  public reset(): void {
    for (let s = 0; s < this.geometry.numSets; s++) {
      for (let w = 0; w < this.sets[s].length; w++) {
        this.sets[s][w].valid = false;
        this.sets[s][w].tag = 0;
        this.sets[s][w].lastUsedCycle = 0;
        this.sets[s][w].insertedCycle = 0;
      }
    }
    this.currentCycle = 0;
  }

  public decompose(address: number): {
    tag: number;
    setIndex: number;
    offset: number;
  } {
    const { offsetBits, indexBits, numSets } = this.geometry;
    const offset = address & ((1 << offsetBits) - 1);
    const setIndex =
      indexBits === 0 ? 0 : (address >>> offsetBits) & (numSets - 1);
    const tag = address >>> (offsetBits + indexBits);
    return { tag, setIndex, offset };
  }

  public access(address: number, isTableAccess: boolean = false): SimStep {
    this.currentCycle++;
    const { tag, setIndex, offset } = this.decompose(address);
    const set = this.sets[setIndex];

    // Check for cache hit
    for (let w = 0; w < set.length; w++) {
      if (set[w].valid && set[w].tag === tag) {
        set[w].lastUsedCycle = this.currentCycle;
        return {
          address,
          hexAddress: "0x" + (address >>> 0).toString(16).toUpperCase().padStart(8, "0"),
          tag,
          setIndex,
          offset,
          hit: true,
          cycle: this.currentCycle,
          isTableAccess,
        };
      }
    }

    // Cache miss: find victim line
    let victimIdx = -1;
    let evictedTag: number | undefined = undefined;

    // First check for empty line
    for (let w = 0; w < set.length; w++) {
      if (!set[w].valid) {
        victimIdx = w;
        break;
      }
    }

    // If all lines are full, apply replacement policy
    if (victimIdx === -1) {
      if (this.replacement === "LRU") {
        let oldestCycle = Infinity;
        for (let w = 0; w < set.length; w++) {
          if (set[w].lastUsedCycle < oldestCycle) {
            oldestCycle = set[w].lastUsedCycle;
            victimIdx = w;
          }
        }
      } else if (this.replacement === "FIFO") {
        let earliestInserted = Infinity;
        for (let w = 0; w < set.length; w++) {
          if (set[w].insertedCycle < earliestInserted) {
            earliestInserted = set[w].insertedCycle;
            victimIdx = w;
          }
        }
      } else {
        // Random replacement
        victimIdx = this.prng.nextInt(0, set.length - 1);
      }
      evictedTag = set[victimIdx].tag;
    }

    // Replace line
    set[victimIdx].valid = true;
    set[victimIdx].tag = tag;
    set[victimIdx].lastUsedCycle = this.currentCycle;
    set[victimIdx].insertedCycle = this.currentCycle;

    return {
      address,
      hexAddress: "0x" + (address >>> 0).toString(16).toUpperCase().padStart(8, "0"),
      tag,
      setIndex,
      offset,
      hit: false,
      evictedTag,
      cycle: this.currentCycle,
      isTableAccess,
    };
  }
}
