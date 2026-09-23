"use client";

import React, { useState } from "react";
import { 
  PanelRightClose, 
  PanelRightOpen, 
  Gavel, 
  Mic, 
  BrainCircuit, 
  Layers, 
  BookOpen, 
  ShieldAlert, 
  Presentation, 
  TrendingUp, 
  Plus, 
  Sparkles, 
  X, 
  ChevronRight,
  Info,
  Scale,
  Award
} from "lucide-react";
import { PersonaMode, Project } from "@/types";

interface StudioPanelProps {
  project: Project | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onTriggerJudge: () => void;
  onTriggerVoicePitch: () => void;
  onTriggerMemory: () => void;
  onSelectMode: (mode: PersonaMode) => void;
  onOpenNotes: () => void;
  notesCount: number;
}

export const StudioPanel: React.FC<StudioPanelProps> = ({
  project,
  isCollapsed,
  onToggleCollapse,
  onTriggerJudge,
  onTriggerVoicePitch,
  onTriggerMemory,
  onSelectMode,
  onOpenNotes,
  notesCount,
}) => {
  const [showTipCard, setShowTipCard] = useState(true);

  if (isCollapsed) {
    return (
      <aside className="w-14 shrink-0 flex flex-col items-center py-3 border-l border-white/[0.08] bg-[#090d1a]/85 backdrop-blur-xl transition-all duration-300">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors mb-4"
          title="Expand Studio panel"
        >
          <PanelRightOpen className="h-4 w-4" />
        </button>

        <button
          onClick={onTriggerJudge}
          className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/40 hover:bg-purple-600 hover:text-white transition-all shadow-md shadow-purple-500/10 mb-3"
          title="Run AI Judge"
        >
          <Gavel className="h-4 w-4" />
        </button>

        <button
          onClick={onTriggerVoicePitch}
          className="p-2.5 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-600 hover:text-white transition-all mb-3"
          title="Voice Pitch Practice"
        >
          <Mic className="h-4 w-4" />
        </button>

        <button
          onClick={onOpenNotes}
          className="p-2.5 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/40 hover:bg-amber-600 hover:text-white transition-all"
          title="Project Notes & Scratchpad"
        >
          <Plus className="h-4 w-4" />
        </button>
      </aside>
    );
  }

  const STUDIO_ACTIONS = [
    {
      id: "judge",
      title: "AI Judge",
      subtitle: "Rubric scoring",
      icon: <Gavel className="h-4 w-4 text-purple-400" />,
      color: "from-purple-500/10 to-indigo-500/10 border-purple-500/30",
      action: onTriggerJudge,
    },
    {
      id: "voice",
      title: "Voice Pitch",
      subtitle: "Practice 3-min demo",
      icon: <Mic className="h-4 w-4 text-cyan-400" />,
      color: "from-cyan-500/10 to-blue-500/10 border-cyan-500/30",
      action: onTriggerVoicePitch,
    },
    {
      id: "memory",
      title: "Project Memory",
      subtitle: "Rolling summary",
      icon: <BrainCircuit className="h-4 w-4 text-amber-400" />,
      color: "from-amber-500/10 to-orange-500/10 border-amber-500/30",
      action: onTriggerMemory,
    },
    {
      id: "architecture",
      title: "Architecture",
      subtitle: "Tech lead review",
      icon: <Layers className="h-4 w-4 text-blue-400" />,
      color: "from-blue-500/10 to-indigo-500/10 border-blue-500/30",
      action: () => onSelectMode("architecture"),
    },
    {
      id: "research",
      title: "Research Brief",
      subtitle: "Domain synthesis",
      icon: <BookOpen className="h-4 w-4 text-emerald-400" />,
      color: "from-emerald-500/10 to-teal-500/10 border-emerald-500/30",
      action: () => onSelectMode("research"),
    },
    {
      id: "validator",
      title: "Rules Check",
      subtitle: "Disqualification check",
      icon: <ShieldAlert className="h-4 w-4 text-rose-400" />,
      color: "from-rose-500/10 to-red-500/10 border-rose-500/30",
      action: () => onSelectMode("validator"),
    },
    {
      id: "pitch_outline",
      title: "Pitch Outline",
      subtitle: "Story structure",
      icon: <Presentation className="h-4 w-4 text-pink-400" />,
      color: "from-pink-500/10 to-fuchsia-500/10 border-pink-500/30",
      action: () => onSelectMode("pitch"),
    },
    {
      id: "progress",
      title: "Progress Report",
      subtitle: "Milestones & status",
      icon: <TrendingUp className="h-4 w-4 text-violet-400" />,
      color: "from-violet-500/10 to-purple-500/10 border-violet-500/30",
      action: onTriggerMemory,
    },
  ];

  return (
    <aside className="w-80 sm:w-96 shrink-0 flex flex-col border-l border-white/[0.08] bg-[#090d1a]/85 backdrop-blur-xl transition-all duration-300 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-400" />
          <h2 className="font-heading font-bold text-sm text-slate-100 tracking-tight">
            Studio
          </h2>
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title="Collapse Studio panel"
        >
          <PanelRightClose className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Dismissible Tip Card */}
        {showTipCard && (
          <div className="rounded-2xl border border-white/[0.08] bg-[#0d1226]/80 p-3.5 backdrop-blur-md relative group">
            <button
              onClick={() => setShowTipCard(false)}
              className="absolute top-2.5 right-2.5 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="flex items-start gap-2.5">
              <div className="h-6 w-6 rounded-lg bg-cyan-500/15 text-cyan-300 flex items-center justify-center shrink-0 mt-0.5">
                <Info className="h-3.5 w-3.5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-200">
                  Turn your project into a stronger submission
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Run regular dual-evaluations to eliminate blind spots before demo day.{" "}
                  <button
                    onClick={onTriggerJudge}
                    className="text-purple-400 hover:text-purple-300 font-semibold underline"
                  >
                    Learn more
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Highlighted Banner Card: Run AI Judge */}
        <div
          onClick={onTriggerJudge}
          className="rounded-2xl border border-purple-500/40 bg-gradient-to-br from-purple-950/60 via-slate-900/80 to-indigo-950/60 p-4 cursor-pointer hover:border-purple-400 transition-all shadow-lg shadow-purple-500/15 group relative overflow-hidden"
        >
          <div className="absolute -right-6 -bottom-6 h-24 w-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/30">
                <Scale className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  Run AI Judge on this project
                </div>
                <div className="text-[11px] text-purple-300">
                  Dual-Run Self-Consistency Engine
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-purple-300 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* 2-Column Action Cards Grid */}
        <div className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
            Studio Shortcuts
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {STUDIO_ACTIONS.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                className="flex flex-col items-start p-3 rounded-2xl border border-white/[0.08] bg-[#0c1022]/70 hover:bg-[#121832] hover:border-purple-500/40 transition-all text-left group shadow-sm hover:shadow-md hover:shadow-purple-500/10"
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div className="p-1.5 rounded-lg bg-slate-900/80 border border-white/[0.06] group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <ChevronRight className="h-3 w-3 text-slate-400 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                  {item.title}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate w-full">
                  {item.subtitle}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Floating "+ Add note" Pill Button Anchored Bottom-Right */}
      <div className="p-4 border-t border-white/[0.08] bg-[#070a14]/80 flex items-center justify-between">
        <span className="text-[11px] font-mono text-slate-400">
          {notesCount} saved notes
        </span>

        <button
          onClick={onOpenNotes}
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-600/25 hover:scale-105 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>+ Add note</span>
        </button>
      </div>
    </aside>
  );
};
