import React from "react";
import { PROJECT_CONFIG } from "../../config/project";
import { ArrowUpRight, Award, BookOpen } from "lucide-react";

interface FooterProps {
  onLaunchLab: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onLaunchLab }) => {
  return (
    <footer className="bg-[#171717] text-[#F5F5F0] border-t-4 border-[#D7FF38] pt-16 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-12 border-b border-[#2A303A]">
          {/* Col 1: Product & Academic Summary */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-[#D7FF38] rounded flex items-end justify-center gap-0.5 p-1">
                <span className="w-1 h-2 bg-[#171717]"></span>
                <span className="w-1 h-3.5 bg-[#171717]"></span>
                <span className="w-1 h-2.5 bg-[#171717]"></span>
              </div>
              <span className="font-display text-2xl font-bold tracking-tight text-[#FFFFFF]">
                {PROJECT_CONFIG.productName}
              </span>
            </div>
            <p className="text-sm text-[#8E99A8] leading-relaxed mb-6 font-mono">
              {PROJECT_CONFIG.title} — An interactive computer organization simulator evaluating how cache block sizing and DMA offloading dictate video streaming buffer stability.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2A303A] border border-[#5A6372] rounded text-xs font-mono text-[#D7FF38]">
              <Award size={14} />
              <span>{PROJECT_CONFIG.dimension}</span>
            </div>
          </div>

          {/* Col 2: Student & Academic Affiliation */}
          <div className="bg-[#1E242D] border-2 border-[#2A303A] p-6 rounded-lg shadow-[4px_4px_0_#000]">
            <h4 className="font-mono text-xs uppercase tracking-wider text-[#D7FF38] mb-4 flex items-center gap-2 font-bold">
              <BookOpen size={14} />
              <span>Academic Credentials</span>
            </h4>
            <div className="space-y-3 font-mono text-xs text-[#F5F5F0]">
              <div>
                <span className="text-[#8E99A8] block text-[10px]">STUDENT NAME</span>
                <span className="font-bold text-sm text-[#FFFFFF]">{PROJECT_CONFIG.studentName}</span>
              </div>
              <div>
                <span className="text-[#8E99A8] block text-[10px]">UNIVERSITY SEAT NUMBER (USN)</span>
                <span className="font-bold text-[#D7FF38]">{PROJECT_CONFIG.usn}</span>
              </div>
              <div>
                <span className="text-[#8E99A8] block text-[10px]">INSTITUTION & DEPARTMENT</span>
                <span>{PROJECT_CONFIG.university}</span>
                <span className="text-[#8E99A8] block text-[10px] mt-0.5">{PROJECT_CONFIG.department}</span>
              </div>
              <div>
                <span className="text-[#8E99A8] block text-[10px]">COURSE CODE & SEMESTER</span>
                <span>{PROJECT_CONFIG.courseCode} • {PROJECT_CONFIG.courseName} ({PROJECT_CONFIG.semester})</span>
              </div>
            </div>
          </div>

          {/* Col 3: Quick Action & Repository */}
          <div className="flex flex-col justify-between">
            <div>
              <h4 className="font-mono text-xs uppercase tracking-wider text-[#8E99A8] mb-3">
                Faculty Deliverables
              </h4>
              <p className="text-xs font-mono text-[#F5F5F0] mb-6">
                Directly produces quantitative empirical data for the Mini Project Evaluation covering <span className="text-[#D7FF38] font-bold">CO4, CO5, and CO6</span>.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={onLaunchLab}
                className="w-full btn-primary text-xs py-3 justify-center gap-2 text-[#171717]"
              >
                <span>OPEN INTERACTIVE LAB</span>
                <ArrowUpRight size={16} />
              </button>

              <a
                href={PROJECT_CONFIG.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2A303A] hover:bg-[#343D49] border border-[#5A6372] rounded text-xs font-mono font-bold text-white transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>View on GitHub</span>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[#8E99A8]">
          <p>© 2026 BufferZero • Designed & Built for Jain University COA Mini Project</p>
          <p className="mt-2 sm:mt-0">Evaluated on CO4 (I/O), CO5 (Memory), CO6 (Pipelining)</p>
        </div>
      </div>
    </footer>
  );
};
