"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Cpu, Database, Sparkles } from "lucide-react";
import { ProtectedRoute } from "@/lib/auth/protected-route";
import { useAuth } from "@/lib/auth/auth-context";
import { Header } from "@/components/navbar/Header";
import { SourcesPanel } from "@/components/panels/SourcesPanel";
import { ChatPanel } from "@/components/panels/ChatPanel";
import { StudioPanel } from "@/components/panels/StudioPanel";
import { CitationDrawer } from "@/components/citations/CitationDrawer";
import { JudgeScorecard } from "@/components/judge/JudgeScorecard";
import { VoicePitchModal } from "@/components/pitch/VoicePitchModal";
import { DocumentUploadModal } from "@/components/ingest/DocumentUploadModal";
import { MemoryDrawer } from "@/components/memory/MemoryDrawer";
import { CostAnalytics } from "@/components/dashboard/CostAnalytics";
import { ProjectNotesModal, ProjectNote } from "@/components/notes/ProjectNotesModal";
import { PersonaMode, Message, Citation, Project, Document, JudgeVerdict, ProjectMemory, DocumentChunk } from "@/types";

export default function ProjectWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = (params?.id as string) || "proj-hackforge-demo-01";

  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [memory, setMemory] = useState<ProjectMemory | null>(null);

  const [selectedMode, setSelectedMode] = useState<PersonaMode>("mentor");
  const [activeView, setActiveView] = useState<"chat" | "judge">("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Panel Collapsing
  const [isSourcesCollapsed, setIsSourcesCollapsed] = useState(false);
  const [isStudioCollapsed, setIsStudioCollapsed] = useState(false);

  // Modals & Drawers
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);
  const [citationChunk, setCitationChunk] = useState<DocumentChunk | null>(null);
  const [isCitationOpen, setIsCitationOpen] = useState(false);
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  // Judge State
  const [verdict, setVerdict] = useState<JudgeVerdict | null>(null);
  const [isRunningJudge, setIsRunningJudge] = useState(false);

  // Project Notes State (Isolated per project)
  const [notes, setNotes] = useState<ProjectNote[]>([]);

  // Rate Limiting & Tokens
  const [remainingQuota, setRemainingQuota] = useState(40);
  const [totalTokensUsed, setTotalTokensUsed] = useState(1200);

  // Fetch Project-Specific Data & Restore Conversation History
  useEffect(() => {
    async function loadProject() {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/projects?projectId=${projectId}&userId=${user.id}`);
        if (!res.ok) {
          console.warn("[Project Workspace] Error response from /api/projects");
          return;
        }

        const data = await res.json();
        if (data.project) {
          setProject(data.project);
        }

        if (data.documents) {
          setDocuments(data.documents);
          setSelectedDocIds(data.documents.map((d: Document) => d.id));
        }

        if (data.messages && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }

        if (data.memory) {
          setMemory(data.memory);
        } else {
          const memRes = await fetch(`/api/memory?projectId=${projectId}&userId=${user.id}`);
          if (memRes.ok) {
            const memData = await memRes.json();
            if (memData.memory) {
              setMemory(memData.memory);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load project workspace data:", err);
      }
    }

    if (projectId && user?.id) {
      loadProject();
    }
  }, [projectId, user?.id]);

  const handleToggleSelectDoc = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((dId) => dId !== id) : [...prev, id]
    );
  };

  const handleSelectDocPreview = (doc: Document) => {
    setSelectedCitation({
      chunk_id: doc.id,
      citation_number: 1,
      score: 0.98,
      source_doc: doc.title,
      page_number: 1,
      excerpt: `Document: ${doc.title} (${doc.file_type}). Grounded in 768-dim pgvector HNSW index.`,
    });
    setIsCitationOpen(true);
  };

  const handleSendMessage = async (text: string) => {
    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      conversation_id: `conv-${projectId}`,
      project_id: projectId,
      user_id: user?.id,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setActiveView("chat");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          mode: selectedMode,
          projectId,
          userId: user?.id,
        }),
      });

      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        if (data.remainingRequests !== undefined) setRemainingQuota(data.remainingRequests);
        if (data.tokensUsed) setTotalTokensUsed((prev) => prev + data.tokensUsed);
      } else if (data.error) {
        const errorMsg: Message = {
          id: `err-${Date.now()}`,
          conversation_id: `conv-${projectId}`,
          role: "assistant",
          content: `⚠️ Error: ${data.error}`,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        conversation_id: `conv-${projectId}`,
        role: "assistant",
        content: "⚠️ Network error connecting to Gemini API.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunJudge = async () => {
    setIsRunningJudge(true);
    setActiveView("judge");

    try {
      const res = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          userId: user?.id,
          pitchNotes: `${project?.name || "Project"}: ${project?.description || ""}`,
        }),
      });

      const data = await res.json();
      if (data.verdict) {
        setVerdict(data.verdict);
        setTotalTokensUsed((prev) => prev + 3800);
      } else if (data.error) {
        console.error("AI Judge error:", data.error);
      }
    } catch (err) {
      console.error("Judge execution error:", err);
    } finally {
      setIsRunningJudge(false);
    }
  };

  const handleSelectCitation = (citation: Citation) => {
    setSelectedCitation(citation);
    setIsCitationOpen(true);
  };

  const handleAddNote = (title: string, content: string) => {
    const newNote: ProjectNote = {
      id: `note-${Date.now()}`,
      title,
      content,
      createdAt: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <ProtectedRoute>
      <div className="flex h-screen flex-col overflow-hidden bg-[#07080d] text-slate-100 selection:bg-purple-500 selection:text-white">
        {/* Top Navbar with Dashboard Breadcrumb */}
        <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#090d1a]/85 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-xl p-2 text-slate-400 hover:bg-slate-800/80 hover:text-white transition-colors"
                title="Back to Projects Dashboard"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-xs font-semibold hidden sm:inline">Projects</span>
              </Link>

              <div className="h-4 w-px bg-white/[0.1] hidden sm:block" />

              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-sm text-slate-200 truncate max-w-[220px]">
                  {project?.name || "Loading Project..."}
                </span>
                <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-500/25 hidden md:inline">
                  HNSW 768d
                </span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsIngestOpen(true)}
                className="rounded-lg border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors"
              >
                + Ingest Docs
              </button>
              <button
                onClick={() => setIsVoiceOpen(true)}
                className="rounded-lg border border-cyan-500/40 bg-cyan-950/40 px-3 py-1.5 text-xs font-medium text-cyan-300 hover:bg-cyan-900/60 transition-colors"
              >
                Voice Pitch
              </button>
              <button
                onClick={() => {
                  setSelectedMode("judge");
                  setActiveView("judge");
                }}
                className="rounded-lg border border-purple-500/40 bg-purple-950/40 px-3 py-1.5 text-xs font-medium text-purple-300 hover:bg-purple-900/60 transition-colors"
              >
                AI Judge
              </button>
              <button
                onClick={() => setIsMemoryOpen(true)}
                className="rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-amber-300 hover:bg-slate-800 transition-colors hidden sm:block"
              >
                Memory
              </button>
              <button
                onClick={() => setIsAnalyticsOpen(true)}
                className="rounded-lg border border-slate-700/80 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-emerald-300 hover:bg-slate-800 transition-colors hidden sm:block"
              >
                Analytics
              </button>
            </div>
          </div>
        </header>

        {/* NotebookLM Three-Panel Workspace Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT PANEL: Sources */}
          <SourcesPanel
            documents={documents}
            isCollapsed={isSourcesCollapsed}
            onToggleCollapse={() => setIsSourcesCollapsed(!isSourcesCollapsed)}
            onOpenIngest={() => setIsIngestOpen(true)}
            selectedDocIds={selectedDocIds}
            onToggleSelectDoc={handleToggleSelectDoc}
            onSelectDocPreview={handleSelectDocPreview}
          />

          {/* CENTER PANEL: Chat / AI Judge Center Screen */}
          <main className="flex-1 flex flex-col overflow-hidden relative">
            {activeView === "judge" ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-2.5 border-b border-white/[0.08] bg-[#090d1a]/90 backdrop-blur-md">
                  <span className="font-heading font-bold text-xs text-purple-300">
                    Dual-Run Judge Evaluation Mode
                  </span>
                  <button
                    onClick={() => setActiveView("chat")}
                    className="text-xs font-semibold text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-900 border border-white/[0.08]"
                  >
                    ← Return to Chat
                  </button>
                </div>
                <JudgeScorecard
                  project={project}
                  verdict={verdict}
                  isRunningJudge={isRunningJudge}
                  onRunJudge={handleRunJudge}
                />
              </div>
            ) : (
              <ChatPanel
                mode={selectedMode}
                onSelectMode={(mode) => {
                  setSelectedMode(mode);
                  if (mode === "judge") setActiveView("judge");
                }}
                messages={messages}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
                onSelectCitation={handleSelectCitation}
                onOpenIngest={() => setIsIngestOpen(true)}
                selectedSourcesCount={selectedDocIds.length}
                remainingQuota={remainingQuota}
              />
            )}
          </main>

          {/* RIGHT PANEL: Studio */}
          <StudioPanel
            project={project}
            isCollapsed={isStudioCollapsed}
            onToggleCollapse={() => setIsStudioCollapsed(!isStudioCollapsed)}
            onTriggerJudge={handleRunJudge}
            onTriggerVoicePitch={() => setIsVoiceOpen(true)}
            onTriggerMemory={() => setIsMemoryOpen(true)}
            onSelectMode={(mode) => {
              setSelectedMode(mode);
              setActiveView("chat");
            }}
            onOpenNotes={() => setIsNotesOpen(true)}
            notesCount={notes.length}
          />
        </div>

        {/* Drawers & Modals */}
        <CitationDrawer
          citation={selectedCitation}
          chunkDetails={citationChunk}
          isOpen={isCitationOpen}
          onClose={() => setIsCitationOpen(false)}
        />

        <MemoryDrawer
          memory={memory}
          isOpen={isMemoryOpen}
          onClose={() => setIsMemoryOpen(false)}
        />

        <CostAnalytics
          isOpen={isAnalyticsOpen}
          onClose={() => setIsAnalyticsOpen(false)}
          totalTokensUsed={totalTokensUsed}
        />

        <DocumentUploadModal
          isOpen={isIngestOpen}
          onClose={() => setIsIngestOpen(false)}
          projectId={projectId}
          onIngestSuccess={async () => {
            const res = await fetch(`/api/projects?projectId=${projectId}&userId=${user?.id || ""}`);
            const data = await res.json();
            if (data.documents) {
              setDocuments(data.documents);
              setSelectedDocIds(data.documents.map((d: Document) => d.id));
            }
          }}
        />

        <VoicePitchModal
          isOpen={isVoiceOpen}
          onClose={() => setIsVoiceOpen(false)}
          projectName={project?.name || "Hackathon Project"}
        />

        <ProjectNotesModal
          isOpen={isNotesOpen}
          onClose={() => setIsNotesOpen(false)}
          notes={notes}
          onAddNote={handleAddNote}
          onDeleteNote={handleDeleteNote}
          onInjectIntoChat={(text) => handleSendMessage(`[From Project Note] ${text}`)}
        />
      </div>
    </ProtectedRoute>
  );
}
