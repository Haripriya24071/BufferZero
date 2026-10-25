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
    ctx.fillStyle = "#12151A";
    ctx.fillRect(0, 0, width, height);

    // Geometric pattern animation
    const time = frameCounter * 0.05;
    const cx = width / 2;
    const cy = height / 2;

    if (!isBuffering) {
      // Moving test pattern representing video frame decode
      ctx.strokeStyle = "#CCFF00";
      ctx.lineWidth = 3;

      // Rotating diamond
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(time);
      ctx.strokeRect(-40, -40, 80, 80);
      ctx.restore();

      // Pulsing concentric circles
      ctx.strokeStyle = "#5A6372";
      ctx.lineWidth = 1.5;
      for (let r = 20; r <= 100; r += 20) {
        ctx.beginPath();
        ctx.arc(cx, cy, r + Math.sin(time + r) * 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Moving scanning sweep line
      const scanX = (frameCounter * 3) % width;
      ctx.fillStyle = "rgba(204, 255, 0, 0.15)";
      ctx.fillRect(scanX, 0, 24, height);
    } else {
      // Buffering frozen frame overlay
      ctx.fillStyle = "rgba(18, 21, 26, 0.85)";
      ctx.fillRect(0, 0, width, height);
    }
  }, [frameCounter, isBuffering]);

  return (
    <div className="card-tactile p-4 space-y-3 bg-[#FFFFFF]">
      {/* Top Header of Video Monitor */}
      <div className="flex items-center justify-between pb-2 border-b border-[#12151A]/10 font-mono text-xs">
        <div className="flex items-center gap-2 font-bold text-[#12151A]">
          <Video size={16} />
          <span>DECODER RENDER MONITOR</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-[#12151A] text-white text-[10px] font-bold">
            {quality}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border border-[#12151A] ${
            isBuffering ? "bg-[#FF3B30] text-white" : "bg-[#CCFF00] text-[#12151A]"
          }`}>
            {fps} FPS
          </span>
        </div>
      </div>

      {/* 16:9 Screen */}
      <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-[#12151A] bg-[#12151A] shadow-[4px_4px_0_#12151A]">
        <canvas
          ref={canvasRef}
          width={480}
          height={270}
          className="w-full h-full block"
        />

        {/* Buffering Spinner Overlay */}
        {isBuffering && (
          <div className="absolute inset-0 bg-[#12151A]/85 flex flex-col items-center justify-center gap-3 text-white">
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
          <span className="px-1.5 py-0.5 bg-[#12151A]/90 text-white rounded border border-[#2A303A]">
            FRAME #{frameCounter}
          </span>
        </div>
      </div>

      {/* Buffer Bar and Playback State */}
      <div className="space-y-1.5 font-mono">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#12151A] text-[11px]">
            FRAME BUFFER LEVEL (0% STALL ➔ 30% RECOVERY):
          </span>
          <span className={`font-extrabold text-xs ${
            isBuffering ? "text-[#FF3B30]" : "text-[#12151A]"
          }`}>
            {bufferLevelPct}%
          </span>
        </div>

        {/* Tactile Fill Track */}
        <div className="w-full h-3 bg-[#EAE5DB] border border-[#12151A] rounded p-0.5 overflow-hidden">
          <div
            className={`h-full rounded-xs transition-all duration-300 ${
              isBuffering ? "bg-[#FF3B30]" : "bg-[#CCFF00]"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, bufferLevelPct))}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};
