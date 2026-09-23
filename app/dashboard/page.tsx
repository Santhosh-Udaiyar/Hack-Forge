"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Search, 
  Grid, 
  List, 
  ChevronDown, 
  LogOut, 
  Settings, 
  Cpu, 
  Sparkles, 
  FolderPlus,
  ArrowRight,
  Layers
} from "lucide-react";
import { ProtectedRoute } from "@/lib/auth/protected-route";
import { useAuth } from "@/lib/auth/auth-context";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { CreateProjectModal } from "@/components/dashboard/CreateProjectModal";
import { Logo } from "@/components/ui/Logo";
import { Project } from "@/types";

const CATEGORY_PILLS = [
  { id: "all", label: "All Projects" },
  { id: "healthcare", label: "Healthcare & ER" },
  { id: "fintech", label: "Fintech & DeFi" },
  { id: "agents", label: "AI Agents" },
  { id: "climate", label: "Climate & Energy" },
  { id: "cybersecurity", label: "Security & Privacy" },
];

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  const { user, signOut } = useAuth();
  const router = useRouter();

  const fetchProjects = async () => {
    if (!user?.id) return;
    setIsLoadingProjects(true);
    try {
      const res = await fetch(`/api/projects?userId=${user.id}`);
      const data = await res.json();
      if (data.projects) {
        setProjects(data.projects);
      }
    } catch (err) {
      console.warn("Failed to fetch projects:", err);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchProjects();
    }
  }, [user]);

  const handleDeleteProject = async (id: string) => {
    try {
      await fetch(`/api/projects?projectId=${id}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Delete project error:", err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  // Filter projects by search and category
  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.track && p.track.toLowerCase().includes(searchQuery.toLowerCase()));

    if (selectedCategory === "all") return matchesSearch;
    return matchesSearch && p.track?.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "HF";

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-[#07080d] text-slate-100 selection:bg-purple-500 selection:text-white">
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#090d1a]/85 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <Logo size={36} />
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  HackForge
                </span>
                <span className="rounded-full bg-purple-500/15 px-2 py-0.2 text-[10px] font-semibold text-purple-300 border border-purple-500/30 hidden sm:inline">
                  Workspace
                </span>
              </div>
            </div>

            {/* Middle Search Bar */}
            <div className="flex items-center gap-3 flex-1 max-w-md mx-6 hidden md:flex">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your projects by name, track, or stack..."
                  className="w-full rounded-2xl border border-white/[0.08] bg-[#0c1022] pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Right Controls: Create CTA + User Avatar */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-600/25 hover:scale-105 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create new</span>
              </button>

              {/* User Avatar Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 p-0.5 text-xs font-bold text-white shadow-md hover:ring-2 hover:ring-purple-500/50 transition-all overflow-hidden"
                  aria-label="User menu"
                >
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user?.name || "Avatar"}
                      className="h-full w-full rounded-full object-cover bg-slate-950"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950">
                      <span>{userInitials}</span>
                    </div>
                  )}
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/[0.1] bg-[#0c1022] shadow-2xl p-2 z-50 backdrop-blur-2xl text-xs space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2.5 border-b border-white/[0.08]">
                      {user?.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user?.name || "Avatar"}
                          className="h-9 w-9 rounded-full object-cover border border-purple-500/30 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 text-xs font-bold text-white shrink-0">
                          {userInitials}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white truncate">{user?.name || "Hacker"}</div>
                        <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        setIsCreateModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-slate-300 hover:bg-slate-800/70 hover:text-white transition-colors"
                    >
                      <Plus className="h-4 w-4 text-purple-400" />
                      <span>New Project Workspace</span>
                    </button>

                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Category Filter Pills (Gemini Notebook Style) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_PILLS.map((pill) => {
              const isSelected = selectedCategory === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setSelectedCategory(pill.id)}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                    isSelected
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/10"
                      : "bg-[#0d1222] text-slate-400 hover:text-slate-200 border border-white/[0.06] hover:border-white/[0.12]"
                  }`}
                >
                  <span>{pill.label}</span>
                </button>
              );
            })}
          </div>

          {/* Recent Projects Section (Gemini Notebook "Recent notebooks") */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-bold text-base text-slate-200">
                Recent projects
              </h2>
              <span className="text-xs font-mono text-slate-400">
                {filteredProjects.length} projects
              </span>
            </div>

            {/* Grid of Projects */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* 1st Card: Create New Project */}
              <div
                onClick={() => setIsCreateModalOpen(true)}
                className="group flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/[0.14] hover:border-purple-500/60 bg-[#0c1022]/40 hover:bg-[#111730]/70 p-6 transition-all duration-300 cursor-pointer h-56 text-center space-y-3 shadow-sm hover:shadow-lg hover:shadow-purple-500/10 backdrop-blur-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/40 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-md">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-sm text-slate-200 group-hover:text-white">
                    Create new project
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[170px]">
                    Launch a fresh, isolated workspace & mentor thread
                  </p>
                </div>
              </div>

              {/* Loading Skeletons */}
              {isLoadingProjects && (
                <>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-56 rounded-3xl border border-white/[0.06] bg-[#0c1022]/40 p-5 animate-pulse space-y-4 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <div className="h-9 w-9 rounded-xl bg-white/[0.08]" />
                        <div className="h-5 w-20 rounded-full bg-white/[0.08]" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 w-3/4 rounded bg-white/[0.08]" />
                        <div className="h-3 w-full rounded bg-white/[0.05]" />
                      </div>
                      <div className="h-3 w-1/2 rounded bg-white/[0.05]" />
                    </div>
                  ))}
                </>
              )}

              {/* Real User Projects List */}
              {!isLoadingProjects &&
                filteredProjects.map((proj) => (
                  <ProjectCard
                    key={proj.id}
                    project={proj}
                    onDelete={handleDeleteProject}
                  />
                ))}
            </div>

            {/* Empty State when user has 0 projects */}
            {projects.length === 0 && !isLoadingProjects && (
              <div className="rounded-3xl border border-white/[0.08] bg-[#0c1022]/60 p-12 text-center max-w-md mx-auto space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 mx-auto border border-purple-500/20">
                  <FolderPlus className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-heading text-sm font-bold text-white">
                    No projects yet — start your first one
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Create a fresh hackathon project to start chatting with grounded AI mentors, practice your pitch, and run judge evaluations.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-purple-500 transition-all"
                >
                  + Create new project
                </button>
              </div>
            )}
          </section>
        </main>

        {/* Create Project Modal */}
        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={fetchProjects}
        />
      </div>
    </ProtectedRoute>
  );
}
