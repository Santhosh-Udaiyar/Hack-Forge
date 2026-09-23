"use client";

import React from "react";
import { X, FileText, CheckCircle, Percent, Bookmark, ArrowUpRight } from "lucide-react";
import { Citation, DocumentChunk } from "@/types";

interface CitationDrawerProps {
  citation: Citation | null;
  chunkDetails?: DocumentChunk | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CitationDrawer: React.FC<CitationDrawerProps> = ({
  citation,
  chunkDetails,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !citation) return null;

  const scorePercentage = Math.round(citation.score * 100);
  const isHighConfidence = scorePercentage >= 75;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-slate-800 bg-[#0b1021] shadow-2xl backdrop-blur-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Bookmark className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Citation [{citation.citation_number}] Verification
            </h3>
            <p className="text-[11px] text-slate-400">
              pgvector HNSW Grounded Source Excerpt
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

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Document metadata card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-semibold text-slate-200">
                {citation.source_doc}
              </span>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                isHighConfidence
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
              }`}
            >
              <Percent className="h-3 w-3" />
              {scorePercentage}% Cosine Match
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5">
            <div>
              <span className="text-slate-400">Page Number:</span>{" "}
              <span className="font-semibold text-slate-200">
                {citation.page_number || 1}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Chunk ID:</span>{" "}
              <span className="font-mono text-slate-300 text-[10px] truncate max-w-[100px] inline-block align-bottom">
                {citation.chunk_id}
              </span>
            </div>
            {citation.char_start !== undefined && (
              <div>
                <span className="text-slate-400">Char Offset:</span>{" "}
                <span className="font-mono text-slate-300">
                  {citation.char_start} - {citation.char_end}
                </span>
              </div>
            )}
            <div>
              <span className="text-slate-400">Vector Model:</span>{" "}
              <span className="font-semibold text-cyan-300">gemini-768d</span>
            </div>
          </div>
        </div>

        {/* Source Text Snippet */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Ground Truth Document Text
          </label>
          <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4 text-xs leading-relaxed text-slate-200 font-sans relative">
            <div className="absolute top-2 right-2 text-[10px] text-purple-400 font-mono bg-purple-900/40 px-1.5 py-0.5 rounded">
              Grounded Evidence
            </div>
            <p className="whitespace-pre-wrap">{chunkDetails?.content || citation.excerpt}</p>
          </div>
        </div>

        {/* RAG Verification Note */}
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-[11px] text-slate-400 space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
            Zero-Hallucination Gate
          </div>
          <p>
            This citation was retrieved using pre-filtered project metadata in pgvector and injected as reference [{citation.citation_number}] into Gemini's context window.
          </p>
        </div>
      </div>
    </div>
  );
};
