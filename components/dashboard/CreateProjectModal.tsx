"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const TRACK_PRESETS = [
  "Healthcare & Accessibility",
  "Fintech & DeFi Innovation",
  "Autonomous AI Agents",
  "Climate & Sustainability",
  "Cybersecurity & Privacy",
  "Developer Tools & Infra",
  "General Track",
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState("");
  const [track, setTrack] = useState("Healthcare & Accessibility");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { user } = useAuth();
  const router = useRouter();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Project name is required");
      return;
    }

    if (!user?.id) {
      setErrorMsg("You must be logged in to create a project workspace.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const summaryText = description.trim() || "Hackathon project workspace";
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          summary: summaryText,
          description: summaryText,
          track,
          tech_stack: [],
          user_id: user.id,
        }),
      });

      const data = await res.json();
      if (data.project?.id) {
        if (onCreated) onCreated();
        onClose();
        router.push(`/project/${data.project.id}`);
      } else {
        setErrorMsg(data.error || "Failed to create project");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/[0.08] bg-[#0c1022]/95 backdrop-blur-2xl shadow-2xl shadow-purple-950/40 p-7 space-y-6 overflow-hidden">
        {/* Subtle top glow highlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 shadow-md shadow-purple-500/20">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-lg text-white tracking-tight">
                Create New Project Workspace
              </h2>
              <p className="font-sans text-xs text-slate-400 mt-0.5">
                Fresh, isolated RAG conversation, vector index & judging sandbox
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors -mr-1 -mt-1"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        {/* 3-Field Low-Friction Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Field 1: Project Name */}
          <div>
            <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Project Name <span className="text-purple-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. NeuroSync — Real-Time BCI Diagnostic Agent"
              className="font-sans w-full rounded-xl border border-white/[0.1] bg-[#080b18]/90 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
              required
              autoFocus
            />
          </div>

          {/* Field 2: Hackathon Track */}
          <div>
            <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Hackathon Track
            </label>
            <div className="relative">
              <select
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                className="font-sans w-full rounded-xl border border-white/[0.1] bg-[#080b18]/90 px-4 py-2.5 text-xs text-slate-200 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all cursor-pointer appearance-none"
              >
                {TRACK_PRESETS.map((t) => (
                  <option key={t} value={t} className="bg-[#0c1022] text-white">
                    {t}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Field 3: Project Summary / Value Proposition */}
          <div>
            <label className="font-sans text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Project Summary / Value Proposition
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the core problem, target audience, and key differentiator for hackathon judges..."
              rows={3}
              className="font-sans w-full rounded-xl border border-white/[0.1] bg-[#080b18]/90 p-3.5 text-xs text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="font-sans px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="font-sans flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>Creating workspace...</span>
              ) : (
                <>
                  <span>Create & Launch</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

