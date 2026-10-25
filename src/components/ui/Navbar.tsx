import React from "react";
import { PROJECT_CONFIG } from "../../config/project";
import { Zap, Terminal } from "lucide-react";

interface NavbarProps {
  currentView: "landing" | "lab";
  onNavigate: (view: "landing" | "lab") => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  return (
    <header className="sticky top-0 z-50 bg-[#F5F2EB]/95 backdrop-blur-sm border-b-2 border-[#12151A] px-4 md:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand & Buffer Meter Icon */}
        <button
          onClick={() => onNavigate("landing")}
          className="flex items-center gap-3 group text-left cursor-pointer bg-transparent border-0"
        >
          {/* Tactile 3-bar buffer logo */}
          <div className="w-8 h-8 bg-[#12151A] rounded flex items-end justify-center gap-1 p-1.5 shadow-[2px_2px_0_#12151A]">
            <span className="w-1.5 h-3 bg-[#CCFF00] rounded-xs group-hover:h-4 transition-all"></span>
            <span className="w-1.5 h-5 bg-[#CCFF00] rounded-xs group-hover:h-6 transition-all"></span>
            <span className="w-1.5 h-4 bg-[#CCFF00] rounded-xs group-hover:h-5 transition-all"></span>
          </div>

          <div>
            <div className="font-display text-xl tracking-tight text-[#12151A] flex items-center gap-2">
              <span>{PROJECT_CONFIG.productName}</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-[#12151A] text-[#CCFF00] rounded font-bold">
                COA v1.0
              </span>
            </div>
            <p className="text-[10px] font-mono text-[#5A6372] hidden sm:block">
              {PROJECT_CONFIG.studentName} • {PROJECT_CONFIG.usn}
            </p>
          </div>
        </button>

        {/* Navigation Links */}
        <nav className="flex items-center gap-2 md:gap-4">
          {currentView === "landing" ? (
            <>
              <a
                href="#problem"
                className="hidden md:inline-block px-3 py-1.5 text-xs font-mono font-bold text-[#12151A] hover:bg-[#EAE5DB] rounded transition-colors"
              >
                Problem
              </a>
              <a
                href="#how-it-works"
                className="hidden md:inline-block px-3 py-1.5 text-xs font-mono font-bold text-[#12151A] hover:bg-[#EAE5DB] rounded transition-colors"
              >
                How It Works
              </a>
              <a
                href="#concepts"
                className="hidden md:inline-block px-3 py-1.5 text-xs font-mono font-bold text-[#12151A] hover:bg-[#EAE5DB] rounded transition-colors"
              >
                Concepts
              </a>
              <a
                href="#outcomes"
                className="hidden md:inline-block px-3 py-1.5 text-xs font-mono font-bold text-[#12151A] hover:bg-[#EAE5DB] rounded transition-colors"
              >
                CO1–CO6
              </a>

              <button
                onClick={() => onNavigate("lab")}
                className="btn-primary text-xs py-2 px-4 shadow-[3px_3px_0_#12151A] hover:shadow-[5px_5px_0_#12151A] flex items-center gap-2"
              >
                <Zap size={15} className="fill-[#12151A]" />
                <span>Launch Simulation Lab</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate("landing")}
                className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
              >
                <Terminal size={14} />
                <span>Overview & Concepts</span>
              </button>

              <div className="flex items-center gap-1 px-2.5 py-1 bg-[#CCFF00] border border-[#12151A] rounded font-mono text-xs font-bold text-[#12151A]">
                <span className="w-2 h-2 rounded-full bg-[#12151A] animate-ping mr-1"></span>
                <span>SIMULATION ACTIVE</span>
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
