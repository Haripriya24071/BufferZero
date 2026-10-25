import React, { useRef, useEffect } from "react";
import { VideoQuality, TransferMode } from "../../engine/types";
import { Play, Pause, Loader2, Video, Volume2, Maximize2 } from "lucide-react";

interface PlayerSimProps {
  quality: VideoQuality;
  transferMode: TransferMode;
  bufferLevelPct: number;
  isBuffering: boolean;
  fps: number;
  frameCounter: number;
}

export const PlayerSim: React.FC<PlayerSimProps> = ({
  quality,
  transferMode,
  bufferLevelPct,
  isBuffering,
  fps,
  frameCounter,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animated video geometric canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background video screen
    ctx.fillStyle = "#171717";
    ctx.fillRect(0, 0, width, height);

    // Geometric pattern animation
    const time = frameCounter * 0.05;
    const cx = width / 2;
    const cy = height / 2;

    if (!isBuffering) {
      // Moving test pattern representing video frame decode
      ctx.strokeStyle = "#D7FF38";
      ctx.lineWidth = 3;

      // Rotating diamond
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time);
      ctx.strokeRect(-40, -40, 80, 80);
      ctx.restore();

      // Pulsing concentric circles in Electric Blue
      ctx.strokeStyle = "#2457FF";
      ctx.lineWidth = 2;
      for (let r = 20; r <= 100; r += 20) {
        ctx.beginPath();
        ctx.arc(cx, cy, r + Math.sin(time + r) * 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Moving scanning sweep line
      const scanX = (frameCounter * 3) % width;
      ctx.fillStyle = "rgba(36, 87, 255, 0.25)";
      ctx.fillRect(scanX, 0, 24, height);
    } else {
      // Buffering frozen frame overlay
      ctx.fillStyle = "rgba(23, 23, 23, 0.88)";
      ctx.fillRect(0, 0, width, height);
    }
  }, [frameCounter, isBuffering]);

  return (
    <div className="card-tactile p-4 space-y-3 bg-[#FFFFFF]">
      {/* Top Header of Video Monitor */}
      <div className="flex items-center justify-between pb-2 border-b border-[#171717]/10 font-mono text-xs">
        <div className="flex items-center gap-2 font-bold text-[#171717]">
          <Video size={16} className="text-[#2457FF]" />
          <span>DECODER RENDER MONITOR</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-[#2457FF] text-white text-[10px] font-bold shadow-[1px_1px_0_#171717]">
            {quality}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border border-[#171717] ${
            isBuffering ? "bg-[#FF3B30] text-white" : "bg-[#D7FF38] text-[#171717]"
          }`}>
            {fps} FPS
          </span>
        </div>
      </div>

      {/* 16:9 Screen */}
      <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-[#171717] bg-[#171717] shadow-[4px_4px_0_#171717]">
        <canvas
          ref={canvasRef}
          width={480}
          height={270}
          className="w-full h-full block"
        />

        {/* Buffering Spinner Overlay */}
        {isBuffering && (
          <div className="absolute inset-0 bg-[#171717]/88 flex flex-col items-center justify-center gap-3 text-white">
            <Loader2 size={36} className="animate-spin text-[#FF3B30]" />
            <div className="text-center font-mono">
              <span className="text-xs uppercase font-extrabold text-[#FF3B30] tracking-wider block">
                BUFFER STALL DETECTED
              </span>
              <span className="text-[10px] text-[#8E99A8]">
                {transferMode === "CPU"
                  ? "CPU busy copying words! Decode stalled."
                  : "Refilling buffer past 30% hysteresis threshold..."}
              </span>
            </div>
          </div>
        )}

        {/* Screen Badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 font-mono text-[9px] pointer-events-none">
          <span className="px-1.5 py-0.5 bg-[#171717]/90 text-white rounded border border-[#262626]">
            FRAME #{frameCounter}
          </span>
        </div>
      </div>

      {/* Buffer Bar and Playback State */}
      <div className="space-y-1.5 font-mono">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#171717] text-[11px]">
            FRAME BUFFER LEVEL (0% STALL ➔ 30% RECOVERY):
          </span>
          <span className={`font-extrabold text-xs ${
            isBuffering ? "text-[#FF3B30]" : "text-[#171717]"
          }`}>
            {bufferLevelPct}%
          </span>
        </div>

        {/* Tactile Fill Track */}
        <div className="w-full h-3 bg-[#EBEBE6] border border-[#171717] rounded p-0.5 overflow-hidden">
          <div
            className={`h-full rounded-xs transition-all duration-300 ${
              isBuffering ? "bg-[#FF3B30]" : "bg-[#D7FF38]"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, bufferLevelPct))}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};
