"use client";

import React from "react";
import { 
  Sparkles, 
  Gavel, 
  Mic, 
  UploadCloud, 
  BrainCircuit, 
  BarChart3, 
  ShieldCheck, 
  Database,
  Cpu
} from "lucide-react";
import { Project } from "@/types";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/lib/auth/auth-context";
import Link from "next/link";

interface HeaderProps {
  project: Project | null;
  onOpenIngest: () => void;
  onOpenJudge: () => void;
  onOpenVoice: () => void;
  onOpenMemory: () => void;
  onOpenAnalytics: () => void;
  activeView: string;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  onOpenIngest,
  onOpenJudge,
  onOpenVoice,
  onOpenMemory,
  onOpenAnalytics,
  activeView,
}) => {
  const { user } = useAuth();
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "HF";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#070b18]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Project Info */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <Logo size={38} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  HackForge
                </span>
                <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-300 border border-purple-500/30">
                  v2.0 Production
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                AI Mentor, Dual-Run Judge & Gemini Live Platform
              </p>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2 border-l border-slate-800 pl-4">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Active Project
              </span>
              <span className="text-xs font-semibold text-slate-200 max-w-[200px] truncate">
                {project?.name || "MediPulse AI"}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
              <Database className="h-3 w-3" />
              HNSW (768d)
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={onOpenIngest}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition-all hover:border-slate-600 hover:bg-slate-800"
            title="Upload and index hackathon rules or project docs"
          >
            <UploadCloud className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Ingest Docs</span>
          </button>

          <button
            onClick={onOpenVoice}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-3 py-1.5 text-xs font-medium text-cyan-300 transition-all hover:bg-cyan-900/60 hover:border-cyan-400 shadow-sm shadow-cyan-500/10"
          >
            <Mic className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span>Voice Pitch</span>
          </button>

          <button
            onClick={onOpenJudge}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all shadow-sm ${
              activeView === "judge"
                ? "border-purple-500 bg-purple-600 text-white shadow-purple-500/25"
                : "border-purple-500/40 bg-purple-950/40 text-purple-300 hover:bg-purple-900/60 hover:border-purple-400"
            }`}
          >
            <Gavel className="h-3.5 w-3.5 text-purple-300" />
            <span className="font-semibold">AI Judge</span>
          </button>

          <button
            onClick={onOpenMemory}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800"
            title="Persistent multi-day project memory"
          >
            <BrainCircuit className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden lg:inline">Memory</span>
          </button>

          <button
            onClick={onOpenAnalytics}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800"
            title="Token analytics & spend monitoring"
          >
            <BarChart3 className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Analytics</span>
          </button>

          {/* User Profile Avatar / Back to Dashboard */}
          <Link
            href="/dashboard"
            title={user ? `${user.name} (${user.email})` : "Dashboard"}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 p-0.5 text-[11px] font-bold text-white shadow-md hover:ring-2 hover:ring-purple-500/50 transition-all overflow-hidden ml-1"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name || "Avatar"}
                className="h-full w-full rounded-full object-cover bg-slate-950"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950">
                <span>{userInitials}</span>
              </div>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};

