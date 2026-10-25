import React from "react";
import { PROJECT_CONFIG } from "../../config/project";
import { Zap, Terminal } from "lucide-react";

interface NavbarProps {
  currentView: "landing" | "lab";
  onNavigate: (view: "landing" | "lab") => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  return (
    <header className="sticky top-0 z-50 bg-[#F5F5F0]/95 backdrop-blur-sm border-b-2 border-[#171717] px-4 md:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand & Buffer Meter Icon */}
        <button
          onClick={() => onNavigate("landing")}
          className="flex items-center gap-3 group text-left cursor-pointer bg-transparent border-0"
        >
          {/* Tactile 3-bar buffer logo with Electric Blue & Lime */}
          <div className="w-8 h-8 bg-[#171717] rounded flex items-end justify-center gap-1 p-1.5 shadow-[2px_2px_0_#171717]">
            <span className="w-1.5 h-3 bg-[#2457FF] rounded-xs group-hover:h-4 transition-all"></span>
            <span className="w-1.5 h-5 bg-[#D7FF38] rounded-xs group-hover:h-6 transition-all"></span>
            <span className="w-1.5 h-4 bg-[#2457FF] rounded-xs group-hover:h-5 transition-all"></span>
          </div>

          <div>
            <div className="font-display text-2xl tracking-tight text-[#171717] font-extrabold">
              {PROJECT_CONFIG.productName}
            </div>
          </div>
        </button>

        {/* Navigation Links */}
        <nav className="flex items-center gap-2 md:gap-4">
          {currentView === "landing" ? (
            <>
              <a
                href="#problem"
                className="hidden md:inline-block px-3 py-1.5 text-xs font-mono font-bold text-[#171717] hover:bg-[#EBEBE6] rounded transition-colors"
              >
                Problem
              </a>
              <a
                href="#how-it-works"
                className="hidden md:inline-block px-3 py-1.5 text-xs font-mono font-bold text-[#171717] hover:bg-[#EBEBE6] rounded transition-colors"
              >
                How It Works
              </a>
              <a
                href="#concepts"
                className="hidden md:inline-block px-3 py-1.5 text-xs font-mono font-bold text-[#171717] hover:bg-[#EBEBE6] rounded transition-colors"
              >
                Concepts
              </a>

              <button
                onClick={() => onNavigate("lab")}
                className="btn-primary text-xs py-2 px-4 shadow-[3px_3px_0_#171717] hover:shadow-[5px_5px_0_#171717] flex items-center gap-2 cursor-pointer"
              >
                <Zap size={15} className="fill-[#171717]" />
                <span>Launch Simulation Lab</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate("landing")}
                className="h-10 px-4 rounded-lg font-mono text-xs font-bold border-2 border-[#171717] bg-[#FFFFFF] hover:bg-[#F5F5F0] text-[#171717] shadow-[2px_2px_0_#171717] flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-y-0.5"
              >
                <Terminal size={14} />
                <span>Overview & Concepts</span>
              </button>

              <div className="h-10 px-4 rounded-lg font-mono text-xs font-bold border-2 border-[#171717] bg-[#D7FF38] text-[#171717] shadow-[2px_2px_0_#171717] flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#2457FF] animate-ping"></span>
                <span>SIMULATION ACTIVE</span>
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
