import { describe, it, expect } from "vitest";
import { CacheModel } from "../cache";
import { TimingModel } from "../timing";
import { BufferDynamics } from "../buffer";
import { Simulation, DEFAULT_CONFIG } from "../simulation";
import { SweepEngine } from "../sweep";

describe("Simulation Engine Test Suite (BufferZero COA Requirements)", () => {
  // Test 1: Address Split into Tag, Index, and Offset
  it("correctly splits 32-bit addresses for 1 KB direct-mapped cache with 16 B blocks", () => {
    // 1 KB total = 1024 bytes
    // blockSize = 16 B -> offsetBits = log2(16) = 4 bits
    // numBlocks = 1024 / 16 = 64 blocks
    // direct-mapped (assoc = 1) -> numSets = 64 -> indexBits = log2(64) = 6 bits
    // tagBits = 32 - 6 - 4 = 22 bits
    const cache = new CacheModel(1 as any, 16, 1, "LRU");
    expect(cache.geometry.offsetBits).toBe(4);
    expect(cache.geometry.indexBits).toBe(6);
    expect(cache.geometry.tagBits).toBe(22);

    // Address 0x000001A4
    // 0x1A4 = binary ... 0001 1010 0100
    // Offset (last 4 bits): 0100 = 4
    // Index (next 6 bits): 011010 = 26
    // Tag: 0
    const decomp = cache.decompose(0x000001a4);
    expect(decomp.offset).toBe(4);
    expect(decomp.setIndex).toBe(26);
    expect(decomp.tag).toBe(0);
  });

  // Test 2: Hand-Checkable Trace (document in README for student viva presentation)
  it("verifies known hand-checkable trace sequence (1 KB direct-mapped, 16 B blocks)", () => {
    const cache = new CacheModel(1 as any, 16, 1, "LRU");

    // Address sequence:
    // 0x0000 (Set 0, Tag 0) -> MISS (cold)
    // 0x0004 (Set 0, Tag 0, offset 4) -> HIT (spatial locality, same block)
    // 0x0008 (Set 0, Tag 0, offset 8) -> HIT (spatial locality)
    // 0x0400 (Set 0, Tag 1) -> MISS (conflict miss, evicts Tag 0)
    // 0x0000 (Set 0, Tag 0) -> MISS (was evicted)
    const step1 = cache.access(0x0000);
    expect(step1.hit).toBe(false);

    const step2 = cache.access(0x0004);
    expect(step2.hit).toBe(true);

    const step3 = cache.access(0x0008);
    expect(step3.hit).toBe(true);

    const step4 = cache.access(0x0400);
    expect(step4.hit).toBe(false);
    expect(step4.evictedTag).toBe(0);

    const step5 = cache.access(0x0000);
    expect(step5.hit).toBe(false);
  });

  // Test 3: LRU vs FIFO replacement on crafted 2-way associative sequence
  it("produces distinct hit/miss outcomes for LRU vs FIFO on crafted access sequences", () => {
    // 2-way associative, single set
    // Access sequence: A, B, A, C (where A, B, C map to same set)
    // In LRU: after A, B, A, line B is least recently used. Accessing C evicts B. Set has {A, C}.
    // Then accessing A is a HIT!
    // In FIFO: line A was inserted earliest. Accessing C evicts A! Set has {B, C}.
    // Then accessing A is a MISS!

    const cacheLRU = new CacheModel(4, 64, 2, "LRU");
    const cacheFIFO = new CacheModel(4, 64, 2, "FIFO");

    // Addresses mapping to set 0 with different tags:
    const addrA = 0x0000;
    const addrB = 0x10000;
    const addrC = 0x20000;

    // Run on LRU
    cacheLRU.access(addrA);
    cacheLRU.access(addrB);
    cacheLRU.access(addrA); // makes A MRU, B LRU
    cacheLRU.access(addrC); // evicts B
    const stepA_LRU = cacheLRU.access(addrA);
    expect(stepA_LRU.hit).toBe(true); // HIT in LRU!

    // Run on FIFO
    cacheFIFO.access(addrA);
    cacheFIFO.access(addrB);
    cacheFIFO.access(addrA); // touches A, but FIFO only tracks insertion order
    cacheFIFO.access(addrC); // evicts A because A arrived first!
    const stepA_FIFO = cacheFIFO.access(addrA);
    expect(stepA_FIFO.hit).toBe(false); // MISS in FIFO!
  });

  // Test 4: AMAT and CPI formulas
  it("matches textbook COA formulas for AMAT and CPI", () => {
    const missPenalty = TimingModel.calculateMissPenalty(64, 8, 80, 4);
    // 80 + (64/8)*4 = 80 + 32 = 112 cycles
    expect(missPenalty).toBe(112);

    // AMAT with 90% hit ratio (10% miss ratio), 1 cycle hit time
    // 1 + 0.10 * 112 = 12.2 cycles
    const amat = TimingModel.calculateAMAT(0.90, missPenalty, 1);
    expect(amat).toBeCloseTo(12.2, 2);

    // CPI with base 1.0, 0.3 mem accesses per instr, 10% miss ratio
    // 1.0 + 0.3 * 0.10 * 112 = 1.0 + 3.36 = 4.36
    const { cpi } = TimingModel.calculateCPI(1.0, 0.3, 0.10, missPenalty);
    expect(cpi).toBeCloseTo(4.36, 2);
  });

  // Test 5: Buffer Hysteresis (0% -> 30%)
  it("implements buffer hysteresis: enters buffering at 0% and does not clear until >= 30%", () => {
    const buffer = new BufferDynamics();
    buffer.reset(10);

    // Drain below 0
    buffer.drainBuffer(15);
    expect(buffer.bufferLevelPct).toBe(0);
    expect(buffer.isBuffering).toBe(true);

    // Refill to 20% -> should STILL be buffering
    buffer.fillBuffer(20);
    expect(buffer.bufferLevelPct).toBe(20);
    expect(buffer.isBuffering).toBe(true);

    // Refill past 30% -> buffering clears!
    buffer.fillBuffer(15);
    expect(buffer.bufferLevelPct).toBe(35);
    expect(buffer.isBuffering).toBe(false);
  });

  // Test 6: Determinism with fixed seed
  it("produces strictly deterministic simulation traces with identical seed", () => {
    const sim1 = new Simulation({ seed: 999 });
    const sim2 = new Simulation({ seed: 999 });

    const steps1 = sim1.step(50);
    const steps2 = sim2.step(50);

    expect(steps1.map((s) => s.address)).toEqual(steps2.map((s) => s.address));
    expect(steps1.map((s) => s.hit)).toEqual(steps2.map((s) => s.hit));
  });

  // Test 7: DMA leaves significantly more CPU free than CPU mode
  it("verifies DMA mode leaves more CPU free than CPU-driven mode for 1080p stream", () => {
    const simCPU = new Simulation({ transferMode: "CPU", quality: "1080p" });
    const simDMA = new Simulation({ transferMode: "DMA", quality: "1080p" });

    simCPU.step(200);
    simDMA.step(200);

    const mCPU = simCPU.getMetrics();
    const mDMA = simDMA.getMetrics();

    expect(mDMA.cpuUtilizationFree).toBeGreaterThan(mCPU.cpuUtilizationFree);
  });
});
