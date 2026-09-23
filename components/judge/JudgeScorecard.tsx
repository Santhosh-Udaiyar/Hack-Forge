"use client";

import React, { useState } from "react";
import { 
  Gavel, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles, 
  Layers, 
  ShieldCheck, 
  RotateCw,
  FileCheck,
  Scale
} from "lucide-react";
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";
import { JudgeVerdict, Project } from "@/types";
import { OFFICIAL_HACKATHON_RUBRIC } from "@/lib/judge/rubric";

interface JudgeScorecardProps {
  project: Project | null;
  verdict: JudgeVerdict | null;
  isRunningJudge: boolean;
  onRunJudge: () => void;
}

export const JudgeScorecard: React.FC<JudgeScorecardProps> = ({
  project,
  verdict,
  isRunningJudge,
  onRunJudge,
}) => {
  const [activeReasoningTab, setActiveReasoningTab] = useState<1 | 2>(1);

  // Format data for Radar Chart
  const radarData = verdict
    ? [
        {
          subject: "Feasibility",
          Run1: verdict.run_1?.rubric_scores.feasibility || 0,
          Run2: verdict.run_2?.rubric_scores.feasibility || 0,
          Final: verdict.final_scores.feasibility || 0,
          fullMark: 5,
        },
        {
          subject: "Originality",
          Run1: verdict.run_1?.rubric_scores.originality || 0,
          Run2: verdict.run_2?.rubric_scores.originality || 0,
          Final: verdict.final_scores.originality || 0,
          fullMark: 5,
        },
        {
          subject: "Tech Depth",
          Run1: verdict.run_1?.rubric_scores.technical_depth || 0,
          Run2: verdict.run_2?.rubric_scores.technical_depth || 0,
          Final: verdict.final_scores.technical_depth || 0,
          fullMark: 5,
        },
        {
          subject: "UI/UX",
          Run1: verdict.run_1?.rubric_scores.ui_ux || 0,
          Run2: verdict.run_2?.rubric_scores.ui_ux || 0,
          Final: verdict.final_scores.ui_ux || 0,
          fullMark: 5,
        },
        {
          subject: "Rules & Track",
          Run1: verdict.run_1?.rubric_scores.rules_compliance || 0,
          Run2: verdict.run_2?.rubric_scores.rules_compliance || 0,
          Final: verdict.final_scores.rules_compliance || 0,
          fullMark: 5,
        },
      ]
    : [];

  const isLowConfidence = verdict?.confidence === "low";

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#050811]">
      {/* Top Banner */}
      <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-indigo-950/40 p-6 backdrop-blur-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-lg shadow-purple-600/30">
                <Gavel className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-extrabold text-white">
                AI Judge & Dual-Run Self-Consistency Engine
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl">
              Impartial 25-point rubric grading executed twice with reworded framings. Automatically flags per-criterion variance exceeding &gt;1.5 delta to prevent evaluation bias.
            </p>
          </div>

          <button
            onClick={onRunJudge}
            disabled={isRunningJudge}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-purple-600/25 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {isRunningJudge ? (
              <>
                <RotateCw className="h-4 w-4 animate-spin text-purple-200" />
                <span>Running Dual Evaluations...</span>
              </>
            ) : (
              <>
                <Scale className="h-4 w-4" />
                <span>{verdict ? "Re-Run Dual Judge" : "Run Official AI Judge"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {!verdict && !isRunningJudge && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 mx-auto border border-purple-500/20">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">No Verdict Recorded Yet</h3>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;Run Official AI Judge&quot; above to simulate the dual-run evaluation on <span className="text-slate-200 font-semibold">{project?.name || "your project"}</span>.
            </p>
          </div>
        </div>
      )}

      {verdict && (
        <div className="space-y-6">
          {/* Consistency Confidence Alert */}
          <div
            className={`rounded-xl border p-4 backdrop-blur-md flex items-start gap-3.5 ${
              isLowConfidence
                ? "border-amber-500/40 bg-amber-950/20 text-amber-200"
                : "border-emerald-500/40 bg-emerald-950/20 text-emerald-200"
            }`}
          >
            {isLowConfidence ? (
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase tracking-wider">
                  Self-Consistency Status: {verdict.confidence.toUpperCase()} CONFIDENCE
                </span>
                <span className="rounded bg-black/40 px-2 py-0.5 font-mono text-[11px]">
                  Max Divergence Delta: {verdict.disagreement_delta}/5.0
                </span>
              </div>
              <p className="text-slate-300">{verdict.disagreement_notes}</p>
            </div>
          </div>

          {/* Scores Overview & Radar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Total Score & Criteria Breakdown */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Rubric Breakdown & Dual-Run Agreement
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-black text-white">
                    {verdict.final_scores.total_score.toFixed(1)}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">/ 25.0 pts</span>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 font-semibold">Criterion</th>
                      <th className="py-2.5 font-semibold text-center">Run 1 (Tech)</th>
                      <th className="py-2.5 font-semibold text-center">Run 2 (Product)</th>
                      <th className="py-2.5 font-semibold text-center">Final Score</th>
                      <th className="py-2.5 font-semibold text-right">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {OFFICIAL_HACKATHON_RUBRIC.map((crit) => {
                      const s1 = verdict.run_1?.rubric_scores[crit.id] || 0;
                      const s2 = verdict.run_2?.rubric_scores[crit.id] || 0;
                      const finalS = verdict.final_scores[crit.id] || 0;
                      const delta = Math.abs(s1 - s2);
                      const isDivergent = delta >= 1.5;

                      return (
                        <tr key={crit.id} className="hover:bg-slate-800/40">
                          <td className="py-3 font-semibold text-slate-200">
                            <div>{crit.label}</div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {crit.description.slice(0, 50)}...
                            </div>
                          </td>
                          <td className="py-3 text-center font-mono text-cyan-400">
                            {s1.toFixed(1)}/5
                          </td>
                          <td className="py-3 text-center font-mono text-purple-400">
                            {s2.toFixed(1)}/5
                          </td>
                          <td className="py-3 text-center font-mono font-bold text-white">
                            {finalS.toFixed(1)}/5
                          </td>
                          <td className="py-3 text-right font-mono">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                isDivergent
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-slate-800 text-slate-400"
                              }`}
                            >
                              Δ {delta.toFixed(1)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Radar Chart */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md flex flex-col items-center justify-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 w-full text-left">
                Rubric Radar Mapping
              </h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} stroke="#475569" />
                    <Radar
                      name="Run 1 (Tech)"
                      dataKey="Run1"
                      stroke="#38bdf8"
                      fill="#38bdf8"
                      fillOpacity={0.25}
                    />
                    <Radar
                      name="Run 2 (Product)"
                      dataKey="Run2"
                      stroke="#c084fc"
                      fill="#c084fc"
                      fillOpacity={0.25}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Reasoning Paths Comparison */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Independent Run Reasoning & Evidence Grounding
              </span>
              <div className="flex items-center gap-1 rounded-lg bg-slate-950 p-1 border border-slate-800">
                <button
                  onClick={() => setActiveReasoningTab(1)}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                    activeReasoningTab === 1
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Run 1: Technical Focus
                </button>
                <button
                  onClick={() => setActiveReasoningTab(2)}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                    activeReasoningTab === 2
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Run 2: Product & Innovation Focus
                </button>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950/80 p-4 border border-slate-800 text-xs leading-relaxed text-slate-300 space-y-3">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-purple-400" />
                <span className="font-bold text-slate-200">
                  {activeReasoningTab === 1 ? verdict.run_1?.prompt_framing : verdict.run_2?.prompt_framing}
                </span>
              </div>
              <p className="whitespace-pre-wrap">
                {activeReasoningTab === 1 ? verdict.run_1?.reasoning : verdict.run_2?.reasoning}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
