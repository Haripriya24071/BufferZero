export interface CourseOutcome {
  code: string;
  name: string;
  description: string;
  howCovered: string;
  isCoreMiniProject?: boolean;
}

export const COURSE_OUTCOMES: CourseOutcome[] = [
  {
    code: "CO1",
    name: "Explain CPU Architecture",
    description: "Understand processor organization, bus interconnections, and functional hardware units.",
    howCovered: "Interactive System Architecture diagram showing CPU, Cache, Main Memory, DMA Controller, and interconnecting address/data buses with real-time status telemetry."
  },
  {
    code: "CO2",
    name: "Apply Data Representation",
    description: "Convert and partition memory addresses into hardware-level indexing structures.",
    howCovered: "Real-time 32-bit address decomposition into Tag, Index, and Offset fields with exact bit counts displayed for any cache configuration."
  },
  {
    code: "CO3",
    name: "Analyze Arithmetic Operations",
    description: "Compute architecture performance metrics, cycle latencies, and instruction rates.",
    howCovered: "Live calculation of Average Memory Access Time (AMAT), Cycles Per Instruction (CPI), memory stall overhead, and throughput in MB/s."
  },
  {
    code: "CO4",
    name: "Evaluate I/O Organization",
    description: "Analyze programmed I/O versus Direct Memory Access (DMA) data transfer strategies.",
    howCovered: "Direct comparison between CPU-driven programmed transfer (6 cycles/word copy bottleneck) and DMA transfer (200 setup cycles + 8% cycle stealing), demonstrating video buffer stability.",
    isCoreMiniProject: true
  },
  {
    code: "CO5",
    name: "Analyze Memory Hierarchy",
    description: "Evaluate cache line size, associativity mapping, replacement policies, and memory access latency.",
    howCovered: "Simulation of block sizes (16B to 256B), mapping policies (Direct, 2/4/8-way), replacement algorithms (LRU, FIFO, Random), and plotting the characteristic U-shaped AMAT curve.",
    isCoreMiniProject: true
  },
  {
    code: "CO6",
    name: "Assess Parallel Processing & Pipelining",
    description: "Evaluate instruction pipeline hazards, branch penalties, and memory stall bubbles.",
    howCovered: "5-stage RISC instruction pipeline timeline (IF-ID-EX-MEM-WB) tracking memory stall bubbles injected during cache misses that inflate CPI.",
    isCoreMiniProject: true
  }
];
