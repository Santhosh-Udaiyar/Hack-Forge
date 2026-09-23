"use client";

import React from "react";
import { X, BrainCircuit, CheckCircle, Clock, Tag, Shield, Sparkles } from "lucide-react";
import { ProjectMemory } from "@/types";

interface MemoryDrawerProps {
  memory: ProjectMemory | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryDrawer: React.FC<MemoryDrawerProps> = ({
  memory,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-800 bg-[#0b1021] shadow-2xl backdrop-blur-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <BrainCircuit className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Persistent Project Memory
            </h3>
            <p className="text-[11px] text-slate-400">
              Multi-Day Rolling Context Compression
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
        {/* Project Summary */}
        <div className="space-y-2">
          <label className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
            Rolling Context Summary
          </label>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-slate-300 leading-relaxed">
            {memory?.summary || "No multi-day summary generated yet. Start chatting to build context."}
          </div>
        </div>

        {/* Structured Key Facts */}
        <div className="space-y-3">
          <label className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
            Extracted Structured Facts
          </label>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div>
              <span className="text-slate-400 font-medium">Current Hackathon Stage:</span>
              <div className="mt-1 inline-block rounded-full bg-purple-500/20 px-2.5 py-0.5 font-bold text-purple-300 border border-purple-500/30 uppercase text-[10px]">
                {memory?.key_facts.stage || "Prototyping"}
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-medium">Target User:</span>
              <p className="text-slate-200 mt-0.5 font-semibold">
                {memory?.key_facts.target_user || "Rural triage nurses and emergency intake staff"}
              </p>
            </div>

            <div>
              <span className="text-slate-400 font-medium">Tech Stack:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {(memory?.key_facts.tech_stack || ["Next.js", "Gemini 2.0 Flash", "pgvector"]).map((tech, idx) => (
                  <span key={idx} className="rounded-md bg-slate-800 px-2 py-0.5 text-[10px] text-cyan-300 border border-slate-700">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-slate-400 font-medium">Core Constraints:</span>
              <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-300">
                {(memory?.key_facts.constraints || ["Intermittent 3G network", "Sub-500ms latency", "HIPAA de-identification"]).map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Milestones Checklist */}
        <div className="space-y-2">
          <label className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
            48-Hour Sprint Milestones
          </label>
          <div className="space-y-1.5">
            {(memory?.milestones || []).map((m, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2.5 rounded-xl border p-3 ${
                  m.completed
                    ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                    : "bg-slate-900/60 border-slate-800 text-slate-400"
                }`}
              >
                <CheckCircle className={`h-4 w-4 shrink-0 ${m.completed ? "text-emerald-400" : "text-slate-600"}`} />
                <span className={m.completed ? "line-through text-slate-400" : "font-medium text-slate-200"}>
                  {m.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
