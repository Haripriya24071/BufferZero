# BufferZero: Video Streaming Architecture Performance Analyzer

> **A Computer Organization and Architecture (COA) Interactive Simulation Lab & Viva Defense Tool**  
> Developed for **Jain (Deemed-to-be) University**, Computer Science and Engineering (AI)  
> Course: **25ESCS04 Computer Organization and Architecture (COA)**, III Semester  
> **Candidate:** R Hari Priya | **USN:** 25BTRCA046  
> **Evaluation Component:** Mini Project (CO4, CO5, CO6) • **Dimension:** CT (Computational Thinking) + RWE (Real World Exposure)

---

## 1. Executive Summary & Problem Formulation

### Professor's Assigned Question:
> *"Determine how cache block size and DMA affect the performance of video streaming, using data transfer, DMA, cache, pipeline and memory, and submit a report and a presentation."*

### Scientific Conclusions Proven by BufferZero:
1. **The DMA Effect (CO4 - I/O Organization):**
   - **CPU-Driven Mode (Programmed I/O):** The CPU executes load/store instructions for every word of incoming bitstream ($6\text{ cycles/word}$). At 1080p and 4K, this consumes **70%–90% of total CPU cycles**, bottlenecking the core and causing the video frame buffer to drain to $0\%$, triggering continuous buffering stalls.
   - **DMA Controller Mode:** The CPU spends only ~200 setup cycles. The dedicated DMA controller streams data directly into DRAM using bus cycle stealing (~8% bus usage). This leaves **85%+ of CPU cycles free** to decode frames at a steady 60 FPS without stutter.

2. **The Cache Block Size Effect & U-Shaped AMAT Curve (CO5 - Memory Hierarchy):**
   - **Small Blocks ($16\text{ B}$):** High miss rate ($>35\%$) because sequential video frames do not benefit from spatial prefetching.
   - **Optimal Blocks ($64\text{ B} - 128\text{ B}$):** Lowest AMAT ($~4.2\text{ cycles}$). Fetching 64 bytes brings in the next 16 words for free, raising hit ratio to $>90\%$.
   - **Large Blocks ($256\text{ B}+$):** High miss penalty ($208\text{ cycles}$ over an 8-byte bus). Seeking and scrubbing thrash the cache sets, raising AMAT again.

3. **Pipeline Stalls (CO6 - Pipelining):**
   - Cache misses in the `MEM` stage stall the 5-stage RISC pipeline (`IF`, `ID`, `EX`, `MEM`, `WB`), injecting NOP bubbles and increasing CPI from $1.0$ to over $3.5$.

---

## 2. Core COA Mathematical Formulas

$$\text{Miss Penalty} = t_{\text{mem}} + \left(\frac{\text{Block Size}}{\text{Bus Width}}\right) \times \text{Cycles Per Bus Transfer}$$
$$\text{AMAT} = \text{Hit Time} + (\text{Miss Rate} \times \text{Miss Penalty})$$
$$\text{CPI} = \text{Base CPI} + (\text{Memory Accesses per Instruction} \times \text{Miss Rate} \times \text{Miss Penalty})$$
$$\text{CPU Utilization Free} = \max\left(0, 100\% - (\text{Copy Overhead} + \text{Decode Load} + \text{Stall Overhead})\right)$$

---

## 3. Paper-Reproducible Hand-Checkable Trace (For Viva Defense)

During your viva, your examiner may ask you to trace memory addresses manually on paper. BufferZero contains this exact hand-checkable sequence verified in unit tests:

### Setup Parameters:
- **Cache Size:** $1\text{ KB} = 1024\text{ Bytes}$
- **Block Size:** $16\text{ Bytes}$ $\rightarrow$ $\text{Offset Bits} = \log_2(16) = \mathbf{4\text{ bits}}$
- **Associativity:** $1$ (Direct-Mapped) $\rightarrow \text{Number of Sets} = \frac{1024}{16} = 64$ blocks $\rightarrow \text{Index Bits} = \log_2(64) = \mathbf{6\text{ bits}}$
- **Tag Bits:** $32 - 6 - 4 = \mathbf{22\text{ bits}}$

### 5-Step Address Trace Sequence:

| Step | 32-bit Address (Hex) | Binary Split (Tag [22b] \| Index [6b] \| Offset [4b]) | Set # | Result | Viva Justification |
| :---: | :---: | :---: | :---: | :---: | :--- |
| **1** | `0x00000000` | `000...000` \| `000000` \| `0000` | Set 0 | **MISS** | **Cold / Compulsory Miss**: Line is empty. Tag 0 loaded. |
| **2** | `0x00000004` | `000...000` \| `000000` \| `0100` | Set 0 | **HIT** | **Spatial Locality**: Same 16B block already cached! Offset 4. |
| **3** | `0x00000008` | `000...000` \| `000000` \| `1000` | Set 0 | **HIT** | **Spatial Locality**: Word at offset 8 serviced in 1 cycle. |
| **4** | `0x00000400` | `000...001` \| `000000` \| `0000` | Set 0 | **MISS** | **Conflict Miss**: Maps to Set 0, but Tag is 1. Evicts Tag 0! |
| **5** | `0x00000000` | `000...000` \| `000000` \| `0000` | Set 0 | **MISS** | **Evicted Miss**: Tag 0 was evicted in Step 4. |

---

## 4. Key Architectural Features

- 🏆 **Race Mode (Dual Head-to-Head Arena):** Runs the same 1080p stream simultaneously on a CPU-driven board and a DMA board to prove the conclusion in 5 seconds.
- 🔬 **Rewind Cycle Debugger:** Pause and scrub through the last 200 memory cycles, with real-time 32-bit Tag, Index, and Offset bit breakdown.
- 📐 **Viva Hand-Check Panel:** Every formula on screen shown with real numbers plugged in for whiteboard replication.
- 💥 **"Break-It" Stress Deck:** "Seek Storm", "Cold Cache Flush", and "Network Burst" buttons to stress-test edge cases.
- 🏙️ **3D Circuit City Motherboard Stage:** Embedded interactive 3D motherboard (Sketchfab Circuit City 01 by Giimann) with real-time HUD telemetry overlay.
- ⚡ **Auto-Analyze Sweep:** Background parameter sweep of all block sizes ($16\text{ B}-256\text{ B}$) $\times$ {CPU, DMA} identifying the exact AMAT sweet spot.
- 📄 **Formal Faculty Evaluation Report Generator:** Generates a printable academic report with candidate credentials, course outcomes, and Markdown/CSV export.

---

## 5. Local Setup & Execution

### Prerequisites:
- Node.js (v18+)
- npm (v9+)

### Installation & Launch:
```bash
# Clone the repository
git clone https://github.com/Haripriya24071/BufferZero.git
cd BufferZero

# Install dependencies
npm install

# Run development server
npm run dev

# Run Vitest test suite (verifies hand-checkable trace & timing formulas)
npx vitest run

# Build production bundle
npm run build
npm run preview
```

---

## 6. Syllabus Course Outcomes (CO1–CO6) Matrix

| Course Outcome | Where BufferZero Covers It |
| :--- | :--- |
| **CO1: Explain CPU Architecture** | 3D System Diagram (CPU, Cache, Memory, DMA Controller, Buses), CPU Free Headroom metric. |
| **CO2: Apply Data Representation** | Live 32-bit binary address partition into Tag, Index, and Offset with dynamic bit counts. |
| **CO3: Analyze Arithmetic Operations** | Performance calculations: AMAT, CPI, memory bandwidth, cycle latencies. |
| **CO4: Evaluate I/O Organization** | Programmed I/O (CPU-driven) vs. Direct Memory Access (DMA), cycle stealing, burst mode. *(Core Mini Project)* |
| **CO5: Analyze Memory Hierarchy** | Cache line sizing, associativity mapping, LRU/FIFO replacement, U-shaped AMAT curve. *(Core Mini Project)* |
| **CO6: Assess Parallel Processing** | 5-stage RISC pipeline timeline (IF-ID-EX-MEM-WB) with MEM cache miss stall bubbles. *(Core Mini Project)* |
