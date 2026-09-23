"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  FileText, 
  MoreVertical, 
  Trash2, 
  ArrowUpRight, 
  Layers, 
  Cpu, 
  Activity, 
  Award,
  BookOpen
} from "lucide-react";
import { Project, ProjectStatus } from "@/types";

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
}

const STATUS_CONFIGS: Record<ProjectStatus, { label: string; color: string; bg: string; border: string }> = {
  ideation: {
    label: "Ideation",
    color: "text-fuchsia-300",
    bg: "bg-fuchsia-500/15",
    border: "border-fuchsia-500/30",
  },
  in_progress: {
    label: "In Progress",
    color: "text-cyan-300",
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/30",
  },
  submitted: {
    label: "Submitted",
    color: "text-purple-300",
    bg: "bg-purple-500/15",
    border: "border-purple-500/30",
  },
  judged: {
    label: "Judged",
    color: "text-emerald-300",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
  },
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const status = STATUS_CONFIGS[project.status] || STATUS_CONFIGS.ideation;
  const formattedDate = project.last_activity || new Date(project.updated_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`/project/${project.id}`}
      className="group relative flex flex-col justify-between rounded-3xl border border-white/[0.08] bg-[#0c1022]/75 hover:bg-[#121832]/90 p-5 transition-all duration-300 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/15 cursor-pointer h-56 backdrop-blur-xl block text-left"
    >
      {/* Top row: Icon/Track & Three-dot menu */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600/30 to-cyan-500/20 text-purple-300 border border-purple-500/30 shadow-md group-hover:scale-105 transition-transform">
            <BookOpen className="h-5 w-5" />
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${status.bg} ${status.color} ${status.border}`}
          >
            {status.label}
          </span>
        </div>

        {/* Action Menu */}
        <div className="relative" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <div
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="absolute right-0 top-full mt-1.5 w-36 rounded-xl border border-white/[0.1] bg-[#0b0f20] p-1.5 shadow-2xl z-20 text-xs backdrop-blur-2xl"
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMenu(false);
                  router.push(`/project/${project.id}`);
                }}
                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>Open Workspace</span>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMenu(false);
                  onDelete(project.id);
                }}
                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Middle: Project title & description */}
      <div className="space-y-1.5 my-auto">
        <h3 className="font-heading font-bold text-sm text-slate-100 group-hover:text-purple-300 transition-colors line-clamp-2 leading-snug">
          {project.name}
        </h3>
        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
          {project.description || "Hackathon project workspace"}
        </p>
      </div>

      {/* Footer: Date + message count & track pill */}
      <div className="flex items-center justify-between border-t border-white/[0.06] pt-3 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 font-medium">
          <span>{formattedDate}</span>
          <span>·</span>
          <span className="font-mono text-cyan-300">{project.message_count ?? 0} msgs</span>
        </div>

        <span className="text-[10px] font-mono text-slate-400 truncate max-w-[110px]">
          {project.track || "General"}
        </span>
      </div>
    </Link>
  );
};
