"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  RotateCw, 
  Layers, 
  Database,
  Sparkles,
  Mic,
  Square,
  FileUp,
  AlignLeft,
  Volume2,
  Trash2
} from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onIngestSuccess: () => void;
}

type IngestTab = "pdf" | "voice" | "text";

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onIngestSuccess,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<IngestTab>("pdf");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [fileType, setFileType] = useState<string>("hackathon_rules");
  const [rawText, setRawText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState<number>(0);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);
  const recognitionRef = useRef<any>(null);
  const voiceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Speech Recognition setup for Voice Note tab
  useEffect(() => {
    if (isRecording) {
      voiceTimerRef.current = setInterval(() => {
        setVoiceSeconds((prev) => prev + 1);
      }, 1000);

      const waveInterval = setInterval(() => {
        setAudioLevel(Math.random() * 80 + 20);
      }, 120);

      if (typeof window !== "undefined") {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          try {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onresult = (event: any) => {
              let currentTranscript = "";
              for (let i = 0; i < event.results.length; i++) {
                currentTranscript += event.results[i][0].transcript + " ";
              }
              const clean = currentTranscript.trim();
              setVoiceTranscript(clean);
              setRawText(clean);
            };

            recognition.onerror = (err: any) => {
              console.warn("Speech recognition error:", err);
            };

            recognition.start();
            recognitionRef.current = recognition;
          } catch (e) {
            console.warn("Could not start SpeechRecognition:", e);
          }
        }
      }

      return () => {
        if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
        clearInterval(waveInterval);
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch {}
        }
      };
    } else {
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setAudioLevel(0);
    }
  }, [isRecording]);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const selected = e.dataTransfer.files[0];
      setFile(selected);
      if (!docTitle) {
        setDocTitle(selected.name);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!docTitle) {
        setDocTitle(selected.name);
      }
    }
  };

  const handleUpload = async () => {
    const hasContent = file || rawText.trim() || voiceTranscript.trim();
    if (!hasContent) return;

    setIsUploading(true);
    setResultMsg(null);
    setStep(1); // Extracting

    try {
      const formData = new FormData();
      if (file && activeTab === "pdf") {
        formData.append("file", file);
      }
      
      const contentToIngest = activeTab === "voice" ? voiceTranscript : rawText;
      if (contentToIngest && (activeTab !== "pdf" || !file)) {
        formData.append("text", contentToIngest);
      }

      const finalTitle = docTitle.trim() || file?.name || (activeTab === "voice" ? `Voice Note ${new Date().toLocaleDateString()}` : "Grounded Project Spec");
      formData.append("title", finalTitle);
      formData.append("fileType", fileType);
      formData.append("projectId", projectId);
      if (user?.id) formData.append("userId", user.id);

      setTimeout(() => setStep(2), 400); // LangChain chunking
      setTimeout(() => setStep(3), 900); // 768d Embedding Batch

      const res = await fetch("/api/ingest", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setStep(4); // pgvector HNSW Index Complete

      if (data.success) {
        setResultMsg(`Successfully indexed ${data.chunkCount || "document"} chunks into 768-dim pgvector HNSW index.`);
        onIngestSuccess();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setResultMsg(data.error || "Failed to index document");
      }
    } catch (err: any) {
      setResultMsg(err?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const loadSampleRules = () => {
    setDocTitle("Official AI Hackathon 2026 Rules & Rubric.pdf");
    setFileType("hackathon_rules");
    setRawText(`RULE 1: ELIGIBILITY & TEAM LIMITS. Teams must consist of 1 to 4 members. All code, design assets, and architectural documents must be created during the official 48-hour hacking window. Using pre-existing proprietary codebases without open-source disclosure is grounds for immediate disqualification. Open-source libraries, APIs, and public frameworks are permitted provided they are declared in the README.

RULE 2: OFFICIAL JUDGING RUBRIC & CRITERIA (Total 25 Points):
- Technical Depth & Complexity (0-5 pts): Sophistication of architecture, handling of edge cases, low latency, robust data models.
- Originality & Innovation (0-5 pts): Novel approach to problem solving, distinct value proposition.
- Feasibility & Real-world Viability (0-5 pts): Realistic business/social deployment plan and market fit.
- UI/UX & Demo Polish (0-5 pts): Seamless, intuitive user interface and smooth live execution.
- Rules & Track Alignment (0-5 pts): Compliance with track criteria and sponsor API usage.

RULE 3: SUBMISSION DELIVERABLES & DEMO PITCH. Every team must submit by Sunday 2:00 PM EST:
1. Public GitHub repository with clean setup instructions.
2. A 3-minute unedited demonstration video showcasing the working prototype (no slide-only pitches).
3. Working deployment link or verified local test suite.
Late submissions will receive a 2-point deduction per 15 minutes past the deadline.`);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl border border-white/[0.08] bg-[#0c1022]/95 backdrop-blur-2xl shadow-2xl p-6 space-y-5 overflow-hidden">
        {/* Top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600/30 to-cyan-500/20 text-purple-300 border border-purple-500/30 shadow-md">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-base text-white tracking-tight">
                Grounded Knowledge Ingestion
              </h2>
              <p className="text-xs text-slate-400">
                Index PDF specs, Voice Notes, or Rules into 768-dim Vector Search
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Multi-Modal Ingestion Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-[#080b18] p-1.5 rounded-2xl border border-white/[0.06]">
          <button
            type="button"
            onClick={() => setActiveTab("pdf")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "pdf"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <FileUp className="h-3.5 w-3.5" />
            <span>PDF / Document</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("voice")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "voice"
                ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Mic className="h-3.5 w-3.5" />
            <span>Voice Recording</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("text")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "text"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <AlignLeft className="h-3.5 w-3.5" />
            <span>Text / Markdown</span>
          </button>
        </div>

        {/* Ingestion Steps Progress */}
        {isUploading && (
          <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-semibold animate-pulse">
            <div className={`p-2 rounded-xl border ${step >= 1 ? "bg-purple-950/60 border-purple-500 text-purple-300" : "bg-slate-900 border-white/[0.06] text-slate-500"}`}>
              1. Extract Text
            </div>
            <div className={`p-2 rounded-xl border ${step >= 2 ? "bg-purple-950/60 border-purple-500 text-purple-300" : "bg-slate-900 border-white/[0.06] text-slate-500"}`}>
              2. Semantic Split
            </div>
            <div className={`p-2 rounded-xl border ${step >= 3 ? "bg-purple-950/60 border-purple-500 text-purple-300" : "bg-slate-900 border-white/[0.06] text-slate-500"}`}>
              3. 768d Embed
            </div>
            <div className={`p-2 rounded-xl border ${step >= 4 ? "bg-emerald-950/60 border-emerald-500 text-emerald-300" : "bg-slate-900 border-white/[0.06] text-slate-500"}`}>
              4. HNSW Ready
            </div>
          </div>
        )}

        {/* Metadata Inputs */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Document Title
            </label>
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder={activeTab === "pdf" ? "e.g. Architecture_Spec.pdf" : activeTab === "voice" ? "e.g. Pitch Brainstorm Audio" : "e.g. Hackathon Rules"}
              className="w-full rounded-xl border border-white/[0.1] bg-[#080b18] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Document Type
            </label>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              className="w-full rounded-xl border border-white/[0.1] bg-[#080b18] px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 transition-all cursor-pointer"
            >
              <option value="hackathon_rules">Hackathon Rules & Rubric</option>
              <option value="project_spec">Team Project Spec</option>
              <option value="technical_doc">Technical Architecture Doc</option>
            </select>
          </div>
        </div>

        {/* TAB 1: PDF & Document Dropzone */}
        {activeTab === "pdf" && (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.json,.csv,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!file ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed transition-all cursor-pointer text-center space-y-2.5 ${
                  isDragging
                    ? "border-purple-500 bg-purple-950/20"
                    : "border-white/[0.12] bg-[#080b18]/60 hover:bg-[#080b18] hover:border-purple-500/50"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  <FileUp className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">
                    Click to browse or drag & drop PDF files
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Supports .pdf, .txt, .md, .docx up to 25MB
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-2xl border border-purple-500/30 bg-purple-950/20">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300 font-bold text-xs uppercase border border-purple-500/40">
                    {file.name.endsWith(".pdf") ? "PDF" : "DOC"}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white truncate max-w-[280px]">
                      {file.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB · Ready for pgvector extraction
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                  title="Remove file"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Voice Recording Tab */}
        {activeTab === "voice" && (
          <div className="space-y-3">
            <div className="rounded-3xl border border-white/[0.08] bg-[#080b18] p-5 text-center space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                  <Volume2 className="h-4 w-4" />
                  <span>Speech-to-Text Voice Ingest</span>
                </div>
                <div className="font-mono text-xs font-bold text-slate-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-white/[0.08]">
                  {formatSeconds(voiceSeconds)}
                </div>
              </div>

              {/* Mic Action & Waveform */}
              <div className="flex flex-col items-center gap-3 py-2">
                <button
                  type="button"
                  onClick={() => setIsRecording(!isRecording)}
                  className={`flex h-16 w-16 items-center justify-center rounded-full transition-all shadow-xl ${
                    isRecording
                      ? "bg-rose-600 text-white animate-pulse shadow-rose-600/40 hover:bg-rose-500"
                      : "bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white hover:scale-105 shadow-cyan-600/30"
                  }`}
                >
                  {isRecording ? <Square className="h-6 w-6" /> : <Mic className="h-7 w-7" />}
                </button>
                <span className="text-xs font-semibold text-slate-300">
                  {isRecording ? "Listening... Speak your project thoughts" : "Click microphone to start recording"}
                </span>
              </div>

              {/* Live Transcript Box */}
              <div className="text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Transcribed Audio Content
                </label>
                <textarea
                  value={voiceTranscript}
                  onChange={(e) => {
                    setVoiceTranscript(e.target.value);
                    setRawText(e.target.value);
                  }}
                  placeholder="Your spoken words will appear here automatically..."
                  rows={4}
                  className="w-full rounded-2xl border border-white/[0.08] bg-black/40 p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Text & Markdown Editor */}
        {activeTab === "text" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Document Content / Markdown
              </label>
              <button
                type="button"
                onClick={loadSampleRules}
                className="text-[10px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/25"
              >
                <Sparkles className="h-3 w-3" /> Load Sample Hackathon Rules
              </button>
            </div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste document text here or type markdown rules..."
              rows={5}
              className="w-full rounded-2xl border border-white/[0.1] bg-[#080b18] p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
        )}

        {resultMsg && (
          <div className="rounded-2xl bg-emerald-950/30 border border-emerald-500/40 p-3 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{resultMsg}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading || (activeTab === "pdf" && !file && !rawText.trim()) || (activeTab === "voice" && !voiceTranscript.trim()) || (activeTab === "text" && !rawText.trim())}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100"
          >
            {isUploading ? (
              <>
                <RotateCw className="h-4 w-4 animate-spin" />
                <span>Indexing to pgvector...</span>
              </>
            ) : (
              <>
                <Database className="h-4 w-4" />
                <span>Index Document</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
