import React, { useState } from "react";
import { PROJECT_CONFIG } from "../../config/project";
import { COURSE_OUTCOMES } from "../../data/outcomes";
import { SimConfig, SimMetrics } from "../../engine/types";
import {
  FileText,
  Printer,
  Copy,
  Download,
  X,
  Check,
  Award,
  BookOpen,
} from "lucide-react";

interface FacultyReportProps {
  isOpen: boolean;
  onClose: () => void;
  config: SimConfig;
  metrics: SimMetrics;
}

export const FacultyReport: React.FC<FacultyReportProps> = ({
  isOpen,
  onClose,
  config,
  metrics,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [conclusion, setConclusion] = useState<string>(
    "Direct Memory Access (DMA) combined with an optimal 64-Byte cache block size achieves the lowest Average Memory Access Time (AMAT) and frees over 80% of CPU cycles, preventing video stream buffer stalls and ensuring uninterrupted 60 FPS video playback."
  );

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const generateMarkdown = (): string => {
    return `# ${PROJECT_CONFIG.title} (${PROJECT_CONFIG.productName})
**Mini Project Evaluation Report — Computer Organization and Architecture (25ESCS04)**

## 1. Candidate Details
- **Student Name:** ${PROJECT_CONFIG.studentName}
- **USN:** ${PROJECT_CONFIG.usn}
- **Department:** ${PROJECT_CONFIG.department}
- **Institution:** ${PROJECT_CONFIG.university}
- **Semester & Academic Year:** ${PROJECT_CONFIG.semester}
- **Evaluation Component:** ${PROJECT_CONFIG.evaluationComponent}
- **Dimension:** ${PROJECT_CONFIG.dimension}

---

## 2. Experimental Architecture Configuration
- **Cache Capacity:** ${config.cacheSizeKB} KB
- **Cache Block Size:** ${config.blockSizeB} Bytes
- **Set Associativity:** ${config.associativity}-Way Set Associative
- **Replacement Policy:** ${config.replacement}
- **I/O Transfer Mode:** ${config.transferMode === "DMA" ? "DMA Controller (Hardware Offloading)" : "Programmed I/O (CPU-Driven)"}
- **Stream Bitrate / Quality:** ${config.quality}
- **Bus Width:** ${config.busWidthB} Bytes (64-bit)

---

## 3. Empirical Performance Results
| Metric | Simulated Result | Theoretical Reference Formula |
| :--- | :--- | :--- |
| **Cache Hit Ratio** | ${metrics.hitRatio}% | Hits / Total Accesses |
| **Cache Miss Ratio** | ${metrics.missRatio}% | 1 - Hit Ratio |
| **Miss Penalty** | ${metrics.missPenalty} cycles | t_mem + (BlockSize / BusWidth) × Cycles |
| **Average Memory Access Time (AMAT)** | ${metrics.amat} cycles | Hit Time + (Miss Rate × Miss Penalty) |
| **Cycles Per Instruction (CPI)** | ${metrics.cpi} CPI | Base CPI + (MemAcc × Miss Rate × Penalty) |
| **CPU Headroom (Free)** | ${metrics.cpuUtilizationFree}% | 100% - (Copy% + Decode% + Stall%) |
| **Throughput** | ${metrics.throughputMBps} MB/s | Bus Bandwidth / sqrt(AMAT Factor) |
| **Playback Buffer State** | ${metrics.bufferLevelPct}% (${metrics.isBuffering ? "Buffering Stall" : "Smooth Playback"}) | Hysteresis: 0% stall -> 30% recovery |

---

## 4. Syllabus Mapping & Course Outcomes
${COURSE_OUTCOMES.map((co) => `- **${co.code} (${co.name}):** ${co.howCovered}`).join("\n")}

---

## 5. Analytical Conclusion & Viva Defense
${conclusion}
`;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Metric,Value,Unit\n" +
      `Cache Size,${config.cacheSizeKB},KB\n` +
      `Block Size,${config.blockSizeB},Bytes\n` +
      `Transfer Mode,${config.transferMode},Mode\n` +
      `Hit Ratio,${metrics.hitRatio},%\n` +
      `Miss Penalty,${metrics.missPenalty},cycles\n` +
      `AMAT,${metrics.amat},cycles\n` +
      `CPI,${metrics.cpi},CPI\n` +
      `CPU Free,${metrics.cpuUtilizationFree},%\n` +
      `Buffer Level,${metrics.bufferLevelPct},%\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BufferZero_Report_${config.quality}_${config.transferMode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#12151A]/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FFFFFF] border-3 border-[#12151A] rounded-xl shadow-[8px_8px_0_#12151A] max-w-4xl w-full p-6 md:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Top Action Bar (hidden on print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b-2 border-[#12151A] no-print">
          <div className="flex items-center gap-2">
            <FileText size={22} className="text-[#12151A]" />
            <span className="font-display text-xl text-[#12151A]">
              Faculty Evaluation Report Generator
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              {copied ? <Check size={14} className="text-[#CCFF00]" /> : <Copy size={14} />}
              <span>{copied ? "COPIED!" : "COPY MARKDOWN"}</span>
            </button>

            <button
              onClick={handleDownloadCSV}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Download size={14} />
              <span>CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Printer size={14} />
              <span>PRINT / SAVE PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-[#F5F2EB] text-[#12151A] transition-colors ml-2"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Formal Academic Sheet */}
        <div className="space-y-6 font-mono text-xs text-[#12151A]">
          {/* Header Block */}
          <div className="border-2 border-[#12151A] p-5 rounded-lg bg-[#FAF8F5]">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-[#5A6372] uppercase font-bold">
                  MINI PROJECT EVALUATION REPORT (25ESCS04)
                </span>
                <h1 className="font-display text-2xl text-[#12151A] mt-0.5">
                  {PROJECT_CONFIG.title}
                </h1>
                <p className="text-xs text-[#5A6372] mt-1">
                  Product: {PROJECT_CONFIG.productName} • {PROJECT_CONFIG.dimension}
                </p>
              </div>

              <div className="text-right text-[11px]">
                <span className="font-bold block text-sm">{PROJECT_CONFIG.studentName}</span>
                <span className="text-[#CCFF00] bg-[#12151A] px-2 py-0.5 rounded font-bold inline-block mt-0.5">
                  USN: {PROJECT_CONFIG.usn}
                </span>
                <span className="text-[#5A6372] block mt-1">{PROJECT_CONFIG.university}</span>
              </div>
            </div>
          </div>

          {/* Configuration & Outcomes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Architecture Settings */}
            <div className="border-2 border-[#12151A] p-4 rounded-lg bg-[#FFFFFF]">
              <span className="font-bold text-xs uppercase text-[#12151A] block mb-2 border-b pb-1">
                Active Architecture Parameters
              </span>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#5A6372]">Cache Capacity:</span>
                  <span className="font-bold">{config.cacheSizeKB} KB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A6372]">Cache Block Size:</span>
                  <span className="font-bold">{config.blockSizeB} Bytes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A6372]">Associativity:</span>
                  <span className="font-bold">{config.associativity}-Way Set Associative</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A6372]">Replacement Policy:</span>
                  <span className="font-bold">{config.replacement}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A6372]">Data Transfer Mode:</span>
                  <span className="font-bold">{config.transferMode === "DMA" ? "DMA Controller" : "CPU-Driven (Programmed I/O)"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A6372]">Video Stream Quality:</span>
                  <span className="font-bold">{config.quality}</span>
                </div>
              </div>
            </div>

            {/* Results Snapshot */}
            <div className="border-2 border-[#12151A] p-4 rounded-lg bg-[#FFFFFF]">
              <span className="font-bold text-xs uppercase text-[#12151A] block mb-2 border-b pb-1">
                Quantitative Results
              </span>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#5A6372]">Cache Hit Ratio (CO5):</span>
                  <span className="font-bold">{metrics.hitRatio}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A6372]">AMAT Access Latency:</span>
                  <span className="font-bold">{metrics.amat} Cycles</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A6372]">Instruction CPI (CO6):</span>
                  <span className="font-bold">{metrics.cpi}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A6372]">CPU Utilization Free (CO4):</span>
                  <span className="font-bold">{metrics.cpuUtilizationFree}% Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A6372]">Sustained Throughput:</span>
                  <span className="font-bold">{metrics.throughputMBps} MB/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5A6372]">Playback Stability:</span>
                  <span className={`font-bold ${metrics.isBuffering ? "text-[#FF3B30]" : "text-[#12151A]"}`}>
                    {metrics.isBuffering ? "Buffering Stalled" : "Smooth 60 FPS"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Conclusion Box */}
          <div className="border-2 border-[#12151A] p-4 rounded-lg bg-[#FAF8F5]">
            <span className="font-bold text-xs uppercase text-[#12151A] block mb-1">
              Candidate Conclusion & Viva Defense Statement:
            </span>
            <textarea
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              rows={3}
              className="w-full p-2.5 bg-white border border-[#12151A] rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#CCFF00]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
