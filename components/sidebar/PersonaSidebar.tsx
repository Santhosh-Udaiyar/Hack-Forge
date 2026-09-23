"use client";

import React from "react";
import { 
  Sparkles, 
  Mic, 
  Lightbulb, 
  Layers, 
  BookOpen, 
  ShieldAlert, 
  Gavel, 
  Presentation,
  CheckCircle2,
  Lock
} from "lucide-react";
import { PersonaMode } from "@/types";
import { PERSONA_CONFIGS } from "@/lib/gemini/personas";

interface PersonaSidebarProps {
  selectedMode: PersonaMode;
  onSelectMode: (mode: PersonaMode) => void;
}

const ICONS_MAP: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="h-4 w-4" />,
  Mic: <Mic className="h-4 w-4" />,
  Lightbulb: <Lightbulb className="h-4 w-4" />,
  Layers: <Layers className="h-4 w-4" />,
  BookOpen: <BookOpen className="h-4 w-4" />,
  ShieldAlert: <ShieldAlert className="h-4 w-4" />,
  Gavel: <Gavel className="h-4 w-4" />,
  Presentation: <Presentation className="h-4 w-4" />,
};

export const PersonaSidebar: React.FC<PersonaSidebarProps> = ({
  selectedMode,
  onSelectMode,
}) => {
  const modes = Object.values(PERSONA_CONFIGS);

  return (
    <aside className="w-full lg:w-72 flex-shrink-0 border-r border-slate-800/80 bg-[#070b18]/90 p-3 lg:p-4 flex flex-col gap-3 overflow-y-auto">
      <div className="flex items-center justify-between px-2 pt-1 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Lock className="h-3 w-3 text-purple-400" />
          <span>LLM Personas (Isolated)</span>
        </div>
        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
          8 Modes
        </span>
      </div>

      <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
        {modes.map((persona) => {
          const isSelected = selectedMode === persona.mode;
          const icon = ICONS_MAP[persona.avatarIcon] || <Sparkles className="h-4 w-4" />;

          return (
            <button
              key={persona.mode}
              onClick={() => onSelectMode(persona.mode)}
              className={`group flex items-start gap-3 rounded-xl p-2.5 text-left transition-all duration-200 min-w-[220px] lg:min-w-0 ${
                isSelected
                  ? "bg-slate-800/90 border border-purple-500/50 shadow-md shadow-purple-500/10"
                  : "hover:bg-slate-900/60 border border-transparent hover:border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${persona.color} text-white shadow-sm transition-transform group-hover:scale-105`}
              >
                {icon}
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`truncate text-xs font-semibold ${
                      isSelected ? "text-white" : "text-slate-300"
                    }`}
                  >
                    {persona.name}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-purple-400" />
                  )}
                </div>
                <p className="line-clamp-1 text-[11px] text-slate-400 mt-0.5">
                  {persona.tagline}
                </p>
                <div className="flex items-center gap-1 mt-1.5">
                  <span className="rounded bg-slate-900/80 px-1.5 py-0.2 text-[9px] font-medium text-slate-400 border border-slate-800">
                    Temp {persona.temperature}
                  </span>
                  {persona.groundingRequired ? (
                    <span className="rounded bg-cyan-950/80 px-1.5 py-0.2 text-[9px] font-medium text-cyan-400 border border-cyan-800/40">
                      RAG Active
                    </span>
                  ) : (
                    <span className="rounded bg-pink-950/80 px-1.5 py-0.2 text-[9px] font-medium text-pink-400 border border-pink-800/40">
                      Creative
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-auto border-t border-slate-800/80 pt-3 hidden lg:block">
        <div className="rounded-lg bg-slate-900/60 p-2.5 border border-slate-800 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-300">Prompt Isolation Guarantee:</span> System prompts are strictly separated with zero persona bleed across mode switches.
        </div>
      </div>
    </aside>
  );
};
