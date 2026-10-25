import React from "react";
import { PROJECT_CONFIG } from "../../config/project";
import { ArrowUpRight, Award, BookOpen } from "lucide-react";

interface FooterProps {
  onLaunchLab: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onLaunchLab }) => {
  return (
    <footer className="bg-[#D7FF38] text-[#171717] border-t-4 border-[#171717] pt-16 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-12 border-b-2 border-[#171717]/20">
          {/* Col 1: Product & Academic Summary */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/logo.png"
                alt="BufferZero Logo"
                className="w-8 h-8 rounded-lg object-contain border-2 border-[#171717] shadow-[2px_2px_0_#000000] bg-[#171717]"
              />
              <span className="font-display text-2xl font-black tracking-tight text-[#171717]">
                {PROJECT_CONFIG.productName}
              </span>
            </div>
            <p className="text-sm text-[#171717] leading-relaxed mb-6 font-mono font-medium">
              {PROJECT_CONFIG.title} — An interactive computer organization simulator evaluating how cache block sizing and DMA offloading dictate video streaming buffer stability.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#171717] text-[#D7FF38] border-2 border-[#171717] shadow-[2px_2px_0_#000000] rounded-lg text-xs font-mono font-bold">
              <Award size={14} className="text-[#D7FF38]" />
              <span>{PROJECT_CONFIG.dimension}</span>
            </div>
          </div>

          {/* Col 2: Student & Academic Affiliation */}
          <div className="bg-[#FFFFFF] border-3 border-[#171717] p-6 rounded-xl shadow-[6px_6px_0_#171717] text-[#171717]">
            <h4 className="font-mono text-xs uppercase tracking-wider text-[#171717] mb-4 flex items-center gap-2 font-black">
              <BookOpen size={14} className="text-[#2457FF]" />
              <span>Academic Credentials</span>
            </h4>
            <div className="space-y-3 font-mono text-xs text-[#171717]">
              <div>
                <span className="text-[#525252] block text-[10px] font-bold">STUDENT NAME</span>
                <span className="font-black text-sm text-[#171717]">{PROJECT_CONFIG.studentName}</span>
              </div>
              <div>
                <span className="text-[#525252] block text-[10px] font-bold">UNIVERSITY SEAT NUMBER (USN)</span>
                <span className="font-black text-[#2457FF] bg-[#2457FF]/10 px-2 py-0.5 rounded border border-[#2457FF]">
                  {PROJECT_CONFIG.usn}
                </span>
              </div>
              <div>
                <span className="text-[#525252] block text-[10px] font-bold">INSTITUTION & DEPARTMENT</span>
                <span className="font-bold">{PROJECT_CONFIG.university}</span>
                <span className="text-[#525252] block text-[10px] mt-0.5">{PROJECT_CONFIG.department}</span>
              </div>
              <div>
                <span className="text-[#525252] block text-[10px] font-bold">COURSE CODE & SEMESTER</span>
                <span className="font-bold">{PROJECT_CONFIG.courseCode} • {PROJECT_CONFIG.courseName} ({PROJECT_CONFIG.semester})</span>
              </div>
            </div>
          </div>

          {/* Col 3: Quick Action & Repository */}
          <div className="flex flex-col justify-between">
            <div>
              <h4 className="font-mono text-xs uppercase tracking-wider text-[#171717] font-black mb-3">
                Evaluation Deliverables
              </h4>
              <p className="text-xs font-mono text-[#171717] leading-relaxed mb-6 font-medium">
                Directly produces quantitative empirical data for the Mini Project Evaluation covering <strong className="bg-[#171717] text-white px-1 rounded">CO4 (I/O)</strong>, <strong className="bg-[#171717] text-white px-1 rounded">CO5 (Memory)</strong>, and <strong className="bg-[#171717] text-white px-1 rounded">CO6 (Pipelining)</strong>.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={onLaunchLab}
                className="w-full bg-[#171717] hover:bg-[#262626] text-[#D7FF38] font-black text-xs py-3 rounded-lg border-2 border-[#171717] shadow-[4px_4px_0_#000000] flex items-center justify-center gap-2 cursor-pointer transition-all active:translate-y-0.5"
              >
                <span>OPEN INTERACTIVE LAB</span>
                <ArrowUpRight size={16} />
              </button>

              <a
                href={PROJECT_CONFIG.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FFFFFF] hover:bg-[#F5F5F0] border-2 border-[#171717] shadow-[4px_4px_0_#171717] rounded-lg text-xs font-mono font-black text-[#171717] transition-all cursor-pointer active:translate-y-0.5"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>View on GitHub</span>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[#171717] font-bold">
          <p>© 2026 BufferZero • Designed & Built for Jain University COA Mini Project</p>
          <p className="mt-2 sm:mt-0">Evaluated on CO4 (I/O), CO5 (Memory), CO6 (Pipelining)</p>
        </div>
      </div>
    </footer>
  );
};
