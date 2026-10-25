import React from "react";
import { COURSE_OUTCOMES } from "../../data/outcomes";
import { CheckCircle2, BookmarkCheck } from "lucide-react";

export const OutcomesTable: React.FC = () => {
  return (
    <section id="outcomes" className="py-20 md:py-28 px-4 md:px-8 bg-[#F5F2EB] border-b-2 border-[#12151A]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-[#12151A] font-bold px-3 py-1 bg-[#CCFF00] border border-[#12151A] rounded inline-block shadow-[2px_2px_0_#12151A]">
              Syllabus Alignment Matrix
            </span>
            <h2 className="font-display text-4xl sm:text-5xl text-[#12151A] mt-3 tracking-tight">
              Course Outcomes (CO1–CO6)
            </h2>
          </div>
          <div className="p-3 bg-[#FFFFFF] border-2 border-[#12151A] rounded-lg shadow-[3px_3px_0_#12151A] font-mono text-xs text-[#5A6372]">
            <span className="font-bold text-[#12151A] block">Curriculum Dimension:</span>
            <span>CT (Computational Thinking) + RWE (Real World Exposure)</span>
          </div>
        </div>

        {/* Outcomes Table */}
        <div className="bg-[#FFFFFF] border-3 border-[#12151A] rounded-xl shadow-[8px_8px_0_#12151A] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#12151A] text-white font-mono text-xs uppercase tracking-wider">
                  <th className="py-4 px-6 border-b-2 border-[#12151A] w-24">Code</th>
                  <th className="py-4 px-6 border-b-2 border-[#12151A] w-64">Course Outcome</th>
                  <th className="py-4 px-6 border-b-2 border-[#12151A]">Where BufferZero Covers It</th>
                  <th className="py-4 px-6 border-b-2 border-[#12151A] text-center w-36">Mini Project</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#12151A]/10 font-mono text-xs sm:text-sm">
                {COURSE_OUTCOMES.map((co) => (
                  <tr
                    key={co.code}
                    className={`hover:bg-[#F5F2EB] transition-colors ${
                      co.isCoreMiniProject ? "bg-[#CCFF00]/10" : ""
                    }`}
                  >
                    <td className="py-4 px-6 font-bold text-[#12151A] flex items-center gap-2">
                      <span className="w-7 h-7 rounded bg-[#12151A] text-[#CCFF00] flex items-center justify-center text-xs">
                        {co.code}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-[#12151A]">
                      {co.name}
                      <p className="text-[11px] font-normal text-[#5A6372] mt-0.5">
                        {co.description}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-[#2A303A] leading-relaxed">
                      {co.howCovered}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {co.isCoreMiniProject ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#12151A] text-[#CCFF00] rounded font-bold text-[11px]">
                          <BookmarkCheck size={13} />
                          <span>Core Mark</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#5A6372] text-[11px]">
                          <CheckCircle2 size={13} />
                          <span>Covered</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-[#FAF8F5] border-t-2 border-[#12151A] font-mono text-xs text-[#5A6372] flex items-center justify-between">
            <span>Course Code: 25ESCS04 (Jain University III Semester CSE AI)</span>
            <span className="text-[#12151A] font-bold">Assessed under Mini Project Component</span>
          </div>
        </div>
      </div>
    </section>
  );
};
