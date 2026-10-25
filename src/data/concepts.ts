export interface ConceptItem {
  id: string;
  title: string;
  analogy: string;
  summary: string;
  formula?: string;
  formulaExplanation?: string;
  whyItMatters: string;
  detailedPoints: string[];
}

export const CONCEPTS: ConceptItem[] = [
  {
    id: "cache",
    title: "Cache Memory",
    analogy: "Keeping today's notebook on your desk instead of walking to the library every time you need a fact.",
    summary: "A small, ultra-fast SRAM store located directly on the processor die. A hit services an access in 1 cycle; a miss incurs a punishing 80+ cycle penalty to fetch from DRAM.",
    formula: "AMAT = Hit Time + (Miss Rate × Miss Penalty)",
    formulaExplanation: "Average Memory Access Time combines ultra-fast cache access with the weighted penalty of DRAM trips.",
    whyItMatters: "Video decoding requires sustained high-frequency memory reads for macroblocks. A high miss rate stalls the frame decoder and induces video playback stutter.",
    detailedPoints: [
      "L1 cache latency is typically 1-4 cycles vs DRAM latency of 50-100ns (~80+ clock cycles).",
      "Temporal locality: Recently accessed decoding tables and VLC Huffman trees are reused frequently.",
      "Spatial locality: Consecutive video pixels and bitstream packets sit adjacent in physical memory."
    ]
  },
  {
    id: "block_size",
    title: "Cache Block Size",
    analogy: "Carrying groceries with a wheelbarrow vs carrying one apple at a time.",
    summary: "The atomic unit of data moved between main memory and cache. Video is heavily sequential, so larger blocks prefetch upcoming frame data before the CPU requests it.",
    formula: "Miss Penalty = t_mem + (BlockSize / BusWidth) × CyclesPerTransfer",
    formulaExplanation: "Larger blocks take more bus clock cycles to transfer across the 64-bit (8-byte) memory bus.",
    whyItMatters: "Block size creates a U-shaped AMAT curve. 16B is too small (low hit rate), but 256B takes too many bus cycles to fill and thrashes the cache when user scrubs/seeks.",
    detailedPoints: [
      "16B blocks: Low miss penalty (88 cycles), but high miss rate (~35%) because video spans thousands of bytes.",
      "64B blocks: Optimal balance (~92% hit rate, 112 cycle penalty, lowest overall AMAT).",
      "256B blocks: High miss penalty (208 cycles), and scrubbing causes severe cache pollution."
    ]
  },
  {
    id: "dma",
    title: "Direct Memory Access (DMA)",
    analogy: "A courier delivering packages directly into the warehouse while the manager focuses on running the business.",
    summary: "A dedicated hardware controller that transfers incoming video frames from the Network Interface Card (NIC) directly into main RAM without passing through the CPU registers.",
    formula: "CPU Free = 100% - (CPU_Copy% + CPU_Decode% + Stall%)",
    formulaExplanation: "In CPU mode, CPU spends 6 cycles copying every single word, bottlenecking the core.",
    whyItMatters: "Without DMA, high-bitrate 1080p and 4K streams choke the CPU with programmed memory copy loops, leaving zero headroom for H.264/HEVC decompression.",
    detailedPoints: [
      "CPU-Driven (Programmed I/O): CPU executes LOAD and STORE for every 4 bytes (6 cycles/word).",
      "DMA Mode: CPU pays only 200 setup cycles, then DMA controller moves data autonomously via cycle stealing (~8% bus usage).",
      "Frees over 80% of CPU cycles to decode frames smoothly at 60 FPS."
    ]
  },
  {
    id: "pipeline",
    title: "Instruction Pipelining",
    analogy: "A multi-stage car assembly line where 5 cars are built simultaneously at different workstations.",
    summary: "The CPU breaks instruction execution into 5 stages: Instruction Fetch (IF), Instruction Decode (ID), Execute (EX), Memory Access (MEM), and Write Back (WB).",
    formula: "CPI = Base_CPI + (MemAccesses / Instr × Miss Rate × Miss Penalty)",
    formulaExplanation: "Every cache miss in the MEM stage stalls all upstream instructions, injecting NOP bubbles.",
    whyItMatters: "A cache miss in MEM creates a multi-cycle stall bubble that halts the entire instruction stream, directly degrading system throughput and CPI.",
    detailedPoints: [
      "Ideal CPI of a scalar RISC pipeline is 1.0 (one instruction committed every cycle).",
      "When a cache miss occurs in MEM stage, IF, ID, and EX stages are frozen.",
      "A 15% miss rate with 100 cycle penalty raises CPI from 1.0 to over 4.5!"
    ]
  },
  {
    id: "memory_hierarchy",
    title: "Memory Hierarchy",
    analogy: "A pyramid: tiny & instant at the top (registers), vast & slow at the bottom (cloud storage).",
    summary: "Balancing speed, cost, and capacity by cascading Registers (0 cycles) → L1/L2 Cache (1-4 cycles) → DDR Main Memory (80 cycles) → NVMe SSD / Network (100,000+ cycles).",
    formula: "Access Time: Registers (0.3ns) < L1 (1ns) < RAM (60ns) < Network (20ms)",
    formulaExplanation: "Each layer down is roughly 10x to 100x slower than the layer above it.",
    whyItMatters: "Video streaming lives or dies by buffering. If data isn't staged in the upper hierarchy layers ahead of playback time, the player buffer drains to zero.",
    detailedPoints: [
      "Level 1 / 2 Cache: Holds active frame macroblocks and quantization matrices.",
      "Main Memory (RAM): Holds the uncompressed circular frame buffer (YUV planes).",
      "Network Stream: Arrives in asynchronous TCP/UDP chunks with variable jitter."
    ]
  }
];
