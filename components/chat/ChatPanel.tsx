"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Zap, 
  Bookmark, 
  Copy, 
  Check, 
  RotateCcw,
  Clock,
  Layers,
  ShieldCheck,
  Percent
} from "lucide-react";
import { Message, Citation, PersonaMode } from "@/types";
import { PERSONA_CONFIGS } from "@/lib/gemini/personas";

interface ChatPanelProps {
  mode: PersonaMode;
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onSelectCitation: (citation: Citation) => void;
  remainingQuota: number;
}

const SUGGESTIONS_BY_MODE: Record<PersonaMode, string[]> = {
  mentor: [
    "What are the official hackathon submission requirements and deadlines?",
    "How should our team prioritize our 48-hour development sprints?",
    "What are the main judging criteria and score weights?",
  ],
  voice: [
    "Give me a 30-second summary of our core architecture for our pitch.",
    "How can I quickly explain our low-latency edge pipeline verbally?",
  ],
  ideation: [
    "Brainstorm 3 radical killer features that will surprise hackathon judges.",
    "How can we turn our clinical triage bot into a viral demo?",
    "What are novel AI agent workflows for emergency medical response?",
  ],
  architecture: [
    "Audit our vector retrieval pipeline for sub-500ms edge latency.",
    "How should we structure HNSW indexing and metadata pre-filtering?",
    "Review our offline-first fallback strategy for 3G rural clinics.",
  ],
  research: [
    "Summarize clinical triage validation studies for emergency response.",
    "What are standard HIPAA de-identification guidelines for AI models?",
    "Compare pgvector HNSW vs brute-force IVFFlat under heavy query load.",
  ],
  validator: [
    "Validate our project plan against the official hackathon rules.",
    "Are we allowed to use pre-existing open source libraries?",
    "Audit our project for any disqualification risks in the Healthcare track.",
  ],
  judge: [
    "Grade our current project architecture against the 25-point rubric.",
    "What are our weakest areas where judges will deduct points?",
    "Run a preliminary rubric audit on our technical depth and UI polish.",
  ],
  pitch: [
    "Structure our 3-minute demo pitch for maximum judge impact.",
    "What are 3 tough curveball questions judges will ask during Q&A?",
    "How do we hook the judges in the first 20 seconds?",
  ],
};

export const ChatPanel: React.FC<ChatPanelProps> = ({
  mode,
  messages,
  isLoading,
  onSendMessage,
  onSelectCitation,
  remainingQuota,
}) => {
  const [inputText, setInputText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const persona = PERSONA_CONFIGS[mode] || PERSONA_CONFIGS.mentor;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Render text with robust clickable citation superscripts [1], [2], [1, 2], [1][2]
  const renderMessageContent = (content: string, citations?: Citation[]) => {
    if (!citations || citations.length === 0) {
      return <div className="whitespace-pre-wrap">{content}</div>;
    }

    // Split text by citation brackets e.g. [1], [1, 2], [1][2]
    const regex = /(\[\s*\d+(?:\s*,\s*\d+)*\s*\])/g;
    const parts = content.split(regex);

    return (
      <div className="whitespace-pre-wrap">
        {parts.map((part, idx) => {
          const match = part.match(/\[([\d\s,]+)\]/);
          if (match) {
            const rawNumbers = match[1].split(",").map((n) => parseInt(n.trim(), 10)).filter(Boolean);
            const validBadges = rawNumbers.map((citNumber) => {
              const citation = citations.find((c) => c.citation_number === citNumber);
              if (!citation) return null;
              const scorePct = Math.round(citation.score * 100);
              return (
                <button
                  key={`${idx}-${citNumber}`}
                  onClick={() => onSelectCitation(citation)}
                  className="citation-badge"
                  title={`View grounded source (${scorePct}% match from ${citation.source_doc})`}
                >
                  [{citNumber}]
                </button>
              );
            }).filter(Boolean);

            if (validBadges.length > 0) {
              return <span key={idx} className="inline-flex items-baseline gap-0.5">{validBadges}</span>;
            }
          }
          return <span key={idx}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-1 flex-col h-full bg-[#050811] overflow-hidden">
      {/* Persona Banner */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#070b18]/60 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${persona.color} text-white shadow-sm`}
          >
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">{persona.name}</h2>
              <span className="rounded bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-300 border border-purple-500/20">
                {persona.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">{persona.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-1 text-[11px] text-slate-400 border border-slate-800">
            <Zap className="h-3 w-3 text-cyan-400" />
            <span>Quota: {remainingQuota}/40 rpm</span>
          </div>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto space-y-4 py-12">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${persona.color} text-white shadow-lg shadow-purple-500/20`}
            >
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {persona.name} Initialized
              </h3>
              <p className="text-xs text-slate-400 mt-1">{persona.tagline}</p>
            </div>

            {/* Quick Suggestions */}
            <div className="w-full space-y-2 pt-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Recommended Prompts for this Mode
              </p>
              <div className="space-y-1.5">
                {(SUGGESTIONS_BY_MODE[mode] || []).map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(prompt)}
                    className="w-full text-left rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300 hover:border-purple-500/50 hover:bg-slate-800/80 transition-all group flex items-center justify-between"
                  >
                    <span>{prompt}</span>
                    <Sparkles className="h-3.5 w-3.5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${
                  isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    isUser
                      ? "bg-purple-600 text-white"
                      : `bg-gradient-to-br ${persona.color} text-white`
                  }`}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div
                  className={`flex flex-col space-y-1.5 max-w-[85%] sm:max-w-[78%] ${
                    isUser ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      isUser
                        ? "bg-purple-600 text-white rounded-tr-none shadow-md shadow-purple-600/10"
                        : "glass-panel text-slate-200 rounded-tl-none border border-slate-800"
                    }`}
                  >
                    {renderMessageContent(msg.content, msg.citations)}
                  </div>

                  {/* Citations Footer & Message Metadata */}
                  {!isUser && msg.citations && msg.citations.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 font-medium">
                        Grounded Sources:
                      </span>
                      {msg.citations.map((c) => (
                        <button
                          key={c.chunk_id}
                          onClick={() => onSelectCitation(c)}
                          className="flex items-center gap-1 rounded-md bg-purple-950/60 border border-purple-800/40 px-2 py-0.5 text-[10px] font-semibold text-purple-300 hover:bg-purple-900/60 transition-colors"
                        >
                          <Bookmark className="h-2.5 w-2.5" />
                          [{c.citation_number}] {c.source_doc.slice(0, 18)}... (
                          {Math.round(c.score * 100)}%)
                        </button>
                      ))}
                    </div>
                  )}

                  {!isUser && (
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 px-1">
                      {msg.tokens_used ? (
                        <span>{msg.tokens_used} tokens</span>
                      ) : null}
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="hover:text-slate-200 flex items-center gap-1 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-3 max-w-3xl mr-auto">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${persona.color} text-white animate-pulse`}
            >
              <Bot className="h-4 w-4" />
            </div>
            <div className="glass-panel rounded-2xl rounded-tl-none border border-slate-800 px-4 py-3 text-xs text-slate-300 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span>
                Retrieving HNSW pgvector context & generating grounded response...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-800/80 bg-[#070b18]/80 p-3 sm:p-4 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Ask ${persona.name} (RAG Grounded, Isolated Prompt)...`}
            className="flex-1 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="flex items-center justify-center rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-purple-600/20"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
