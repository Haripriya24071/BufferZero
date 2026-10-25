import React, { useState } from "react";
import { TransferMode } from "../../engine/types";
import { Cpu, Radio, HardDrive, Layers, RefreshCw, Eye, Sparkles, Activity } from "lucide-react";

interface Motherboard3DProps {
  transferMode: TransferMode;
  isBuffering: boolean;
  cpuUtilizationFree: number;
  hitRatio: number;
  currentAddressHex?: string;
}

export const Motherboard3D: React.FC<Motherboard3DProps> = ({
  transferMode,
  isBuffering,
  cpuUtilizationFree,
  hitRatio,
  currentAddressHex = "0x200001A0",
}) => {
  const [viewMode, setViewMode] = useState<"3d_city" | "schematic">("3d_city");
  const [activeChip, setActiveChip] = useState<string>("cpu");

  const chipsInfo: Record<string, { title: string; role: string; status: string; domain: string }> = {
    cpu: {
      title: "Central Processing Unit (CPU)",
      role: transferMode === "CPU" 
        ? "OVERLOADED: Busy executing load/store copy instructions for each word of the video stream."
        : "FREE: Dedicated to video frame decoding (H.264/HEVC) and pipeline execution.",
      status: transferMode === "CPU" ? "Bottlenecked (100% Load)" : `${Math.round(cpuUtilizationFree)}% Free Cycles`,
      domain: "Processor Architecture & Instruction Pipeline",
    },
    dma: {
      title: "Direct Memory Access Controller (DMAC)",
      role: transferMode === "DMA"
        ? "ACTIVE: Directly streaming packets from Network NIC into DRAM via bus cycle stealing."
        : "IDLE: Programmed I/O mode active; CPU handles all transfers word-by-word.",
      status: transferMode === "DMA" ? "Autonomous Bus Master" : "Bypassed / Standby",
      domain: "I/O Organization & Autonomous Bus Mastering",
    },
    cache: {
      title: "On-Chip SRAM Cache Bank (L1/L2)",
      role: "Filters high-speed macroblock reads. Servicing hits in 1 cycle to prevent DRAM stalls.",
      status: `${hitRatio}% Hit Ratio`,
      domain: "High-Speed Memory Hierarchy & Spatial Locality",
    },
    ram: {
      title: "DDR Main Memory (Frame Buffer)",
      role: "Holds the circular video frame buffer and decoded macroblock textures.",
      status: "80 Cycle Access Latency",
      domain: "Primary System Storage & Bus Contention",
    },
    nic: {
      title: "Network Streaming Ingestion Buffer",
      role: "Receives raw compressed bitstream packets from the network interface.",
      status: isBuffering ? "STARVED / WAITING" : "STREAMING ACTIVE",
      domain: "Network I/O Peripheral Interfacing",
    },
  };

  return (
    <div className="card-tactile overflow-hidden flex flex-col">
      {/* Top Header Bar */}
      <div className="bg-[#171717] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#171717]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#D7FF38] animate-pulse"></span>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#FFFFFF]">
            3D Hardware Motherboard Stage
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#2A303A] text-[#D7FF38] font-bold">
            {transferMode === "DMA" ? "DMA EXPRESSWAY ACTIVE" : "CPU BUSY COPYING"}
          </span>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 font-mono text-[11px]">
          <button
            onClick={() => setViewMode("3d_city")}
            className={`px-2 py-1 rounded transition-colors ${
              viewMode === "3d_city"
                ? "bg-[#D7FF38] text-[#171717] font-bold"
                : "text-[#8E99A8] hover:text-white"
            }`}
          >
            3D Circuit City
          </button>
          <button
            onClick={() => setViewMode("schematic")}
            className={`px-2 py-1 rounded transition-colors ${
              viewMode === "schematic"
                ? "bg-[#D7FF38] text-[#171717] font-bold"
                : "text-[#8E99A8] hover:text-white"
            }`}
          >
            Bus Schematic
          </button>
        </div>
      </div>

      {/* Main Visual Stage */}
      <div className="relative w-full h-[540px] lg:h-[600px] bg-[#0A0D12] overflow-hidden">
        {viewMode === "3d_city" ? (
          /* Sketchfab 3D Embed provided by the user */
          <div className="w-full h-full relative">
            <iframe
              title="Circuit City 01"
              className="w-full h-full border-0"
              allowFullScreen
              allow="autoplay; fullscreen; xr-spatial-tracking"
              src="https://sketchfab.com/models/861155128e4c4c70a5229b0de4b74e35/embed?autostart=1&camera=0&preload=1&ui_hint=0&ui_theme=dark"
            ></iframe>

            {/* Live Kinetic HUD Overlay */}
            <div className="absolute top-3 left-3 pointer-events-none z-10 flex flex-col gap-1.5 font-mono text-[11px]">
              <div className="bg-[#171717]/90 text-white px-2.5 py-1 rounded border border-[#D7FF38]/40 backdrop-blur-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D7FF38] animate-ping"></span>
                <span>BUS ADDR: <strong className="text-[#D7FF38]">{currentAddressHex}</strong></span>
              </div>

              <div className={`px-2.5 py-1 rounded border text-[10px] font-bold backdrop-blur-xs ${
                transferMode === "DMA"
                  ? "bg-[#D7FF38]/20 text-[#D7FF38] border-[#D7FF38]"
                  : "bg-[#FF3B30]/20 text-[#FF3B30] border-[#FF3B30]"
              }`}>
                {transferMode === "DMA"
                  ? "⚡ DMA CHANNEL 0: DIRECT BUFFER TO DRAM"
                  : "⚠️ CPU PROGRAMMED I/O: CORE SATURATED WITH COPY"}
              </div>
            </div>

            {/* Quick Component Telemetry Hotbar */}
            <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
              <div className="flex items-center gap-1.5 bg-[#171717]/90 p-1.5 rounded-lg border border-[#2A303A] backdrop-blur-xs">
                {(["cpu", "dma", "cache", "ram", "nic"] as const).map((chip) => (
                  <button
                    key={chip}
                    onClick={() => setActiveChip(chip)}
                    className={`px-2 py-1 rounded font-mono text-[10px] uppercase font-bold transition-all ${
                      activeChip === chip
                        ? "bg-[#D7FF38] text-[#171717] shadow-[2px_2px_0_#000]"
                        : "text-[#8E99A8] hover:text-white bg-[#1E242D]"
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <div className="bg-[#171717]/90 text-xs font-mono text-white px-3 py-1.5 rounded border border-[#2A303A] hidden sm:flex items-center gap-2">
                <Activity size={13} className="text-[#D7FF38]" />
                <span>Interact: Click & Drag to Orbit 3D Board</span>
              </div>
            </div>
          </div>
        ) : (
          /* Technical Bus Schematic View */
          <div className="w-full h-full p-6 flex flex-col justify-between bg-[#171717] text-white">
            <div className="grid grid-cols-5 gap-3 h-full items-center">
              {/* NIC */}
              <div className="bg-[#1E242D] border-2 border-[#2A303A] p-3 rounded-lg text-center">
                <Radio size={20} className="mx-auto mb-1 text-[#D7FF38]" />
                <span className="font-mono text-xs font-bold block">Network NIC</span>
                <span className="text-[10px] font-mono text-[#8E99A8]">Incoming Packets</span>
              </div>

              {/* DMA Controller */}
              <div className={`border-2 p-3 rounded-lg text-center transition-all ${
                transferMode === "DMA"
                  ? "bg-[#D7FF38]/10 border-[#D7FF38] text-[#D7FF38] shadow-[0_0_12px_rgba(204,255,0,0.3)]"
                  : "bg-[#1E242D] border-[#2A303A] text-[#8E99A8]"
              }`}>
                <Sparkles size={20} className="mx-auto mb-1" />
                <span className="font-mono text-xs font-bold block">DMA Controller</span>
                <span className="text-[10px] font-mono">
                  {transferMode === "DMA" ? "Bypassing CPU" : "Standby"}
                </span>
              </div>

              {/* CPU Core */}
              <div className={`border-2 p-3 rounded-lg text-center transition-all ${
                transferMode === "CPU"
                  ? "bg-[#FF3B30]/20 border-[#FF3B30] text-[#FF3B30] shadow-[0_0_12px_rgba(255,59,48,0.4)]"
                  : "bg-[#1E242D] border-[#2A303A] text-white"
              }`}>
                <Cpu size={20} className="mx-auto mb-1" />
                <span className="font-mono text-xs font-bold block">CPU Core</span>
                <span className="text-[10px] font-mono">
                  {transferMode === "CPU" ? "Copying Every Word" : "Decoding Frames"}
                </span>
              </div>

              {/* Cache Bank */}
              <div className="bg-[#1E242D] border-2 border-[#2A303A] p-3 rounded-lg text-center">
                <Layers size={20} className="mx-auto mb-1 text-[#D7FF38]" />
                <span className="font-mono text-xs font-bold block">SRAM Cache</span>
                <span className="text-[10px] font-mono text-[#8E99A8]">1-Cycle Access</span>
              </div>

              {/* Main Memory */}
              <div className="bg-[#1E242D] border-2 border-[#2A303A] p-3 rounded-lg text-center">
                <HardDrive size={20} className="mx-auto mb-1 text-white" />
                <span className="font-mono text-xs font-bold block">DDR RAM</span>
                <span className="text-[10px] font-mono text-[#8E99A8]">80-Cycle Penalty</span>
              </div>
            </div>

            {/* Data flow banner */}
            <div className="bg-[#0A0D12] p-2.5 rounded border border-[#2A303A] font-mono text-xs text-center">
              {transferMode === "DMA" ? (
                <span className="text-[#D7FF38]">
                  Packet Route: NIC ➔ <strong>DMA Bus Master</strong> ➔ DDR RAM (CPU freed for 60 FPS decoding)
                </span>
              ) : (
                <span className="text-[#FF3B30]">
                  Packet Route: NIC ➔ <strong>CPU Load/Store Loop</strong> ➔ DDR RAM (CPU choked at 100% copy load)
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Inspector Detail Strip for Selected Chip */}
      <div className="p-3 bg-[#FFFFFF] border-t-2 border-[#171717] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
        <div>
          <span className="font-bold text-[#171717] text-sm block">
            {chipsInfo[activeChip].title}
          </span>
          <p className="text-[#5A6372] text-[11px] mt-0.5">
            {chipsInfo[activeChip].role}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-[#FFFFFF] border border-[#171717] px-2.5 py-1 rounded">
            <span className="text-[10px] text-[#5A6372] block">STATUS</span>
            <span className="font-bold text-[#171717]">{chipsInfo[activeChip].status}</span>
          </div>
          <div className="bg-[#171717] text-[#D7FF38] px-2.5 py-1 rounded">
            <span className="text-[10px] text-[#8E99A8] block">SUBSYSTEM</span>
            <span className="font-bold text-[10px]">{chipsInfo[activeChip].domain}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
