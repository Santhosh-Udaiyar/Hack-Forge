"use client";

import React from "react";
import { 
  FileText, 
  Plus, 
  PanelLeftClose, 
  PanelLeftOpen, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Sparkles,
  FileCode,
  ShieldAlert,
  ChevronRight
} from "lucide-react";
import { Document } from "@/types";

interface SourcesPanelProps {
  documents: Document[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onOpenIngest: () => void;
  selectedDocIds: string[];
  onToggleSelectDoc: (id: string) => void;
  onSelectDocPreview: (doc: Document) => void;
}

export const SourcesPanel: React.FC<SourcesPanelProps> = ({
  documents,
  isCollapsed,
  onToggleCollapse,
  onOpenIngest,
  selectedDocIds,
  onToggleSelectDoc,
  onSelectDocPreview,
}) => {
  if (isCollapsed) {
    return (
      <aside className="w-14 shrink-0 flex flex-col items-center py-3 border-r border-white/[0.08] bg-[#090d1a]/85 backdrop-blur-xl transition-all duration-300">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors mb-4"
          title="Expand Sources panel"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>

        <button
          onClick={onOpenIngest}
          className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/40 hover:bg-purple-600 hover:text-white transition-all shadow-md shadow-purple-500/10 mb-4"
          title="Add Sources (PDF/Docs)"
        >
          <Plus className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <FileText className="h-4 w-4 text-slate-400" />
            <span className="text-[10px] font-mono text-slate-400 font-bold">
              {documents.length}
            </span>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-72 sm:w-80 shrink-0 flex flex-col border-r border-white/[0.08] bg-[#090d1a]/85 backdrop-blur-xl transition-all duration-300 overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-purple-400" />
          <h2 className="font-heading font-bold text-sm text-slate-100 tracking-tight">
            Sources
          </h2>
          <span className="rounded-full bg-purple-500/15 px-2 py-0.2 text-[10px] font-mono font-bold text-purple-300 border border-purple-500/30">
            {documents.length}
          </span>
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title="Collapse Sources panel"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {/* Add Sources Action Button */}
      <div className="p-3 border-b border-white/[0.06]">
        <button
          onClick={onOpenIngest}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 hover:border-purple-400 text-xs font-semibold text-purple-200 transition-all shadow-sm shadow-purple-500/10 group"
        >
          <Plus className="h-4 w-4 text-purple-400 group-hover:scale-110 transition-transform" />
          <span>+ Add sources</span>
        </button>
      </div>

      {/* Documents List / Empty State */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-4 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">
                Saved sources will appear here
              </p>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Uploaded hackathon rules, track rubrics, and project specs ground every AI mentor and judge answer.
              </p>
            </div>
            <button
              onClick={onOpenIngest}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 hover:underline pt-1"
            >
              or add a source
            </button>
          </div>
        ) : (
          documents.map((doc) => {
            const isSelected = selectedDocIds.includes(doc.id);

            return (
              <div
                key={doc.id}
                className={`group rounded-xl p-2.5 border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#11162b]/90 border-purple-500/50 shadow-md shadow-purple-500/10"
                    : "bg-[#0d1222]/60 hover:bg-[#11172c]/80 border-white/[0.06] hover:border-white/[0.12]"
                }`}
                onClick={() => onSelectDocPreview(doc)}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      onToggleSelectDoc(doc.id);
                    }}
                    className="mt-1 h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-purple-600 focus:ring-purple-500"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition-colors">
                        {doc.title}
                      </span>
                      <ChevronRight className="h-3 w-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span className="uppercase font-mono font-medium text-slate-400">
                        {doc.file_type.replace("_", " ")}
                      </span>
                      <span>•</span>
                      <span>{doc.chunk_count || 1} chunks</span>
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-mono text-emerald-300 font-medium">
                        Ready (768d HNSW)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Grounding Scope Indicator */}
      <div className="p-3 border-t border-white/[0.08] bg-[#070b16]/70 text-[11px] text-slate-400">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium">Grounding Scope:</span>
          <span className="font-mono text-cyan-300 font-semibold">
            {selectedDocIds.length} / {documents.length} Active
          </span>
        </div>
      </div>
    </aside>
  );
};
