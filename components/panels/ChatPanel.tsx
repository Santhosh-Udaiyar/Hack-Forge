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
  ChevronDown,
  Trash2,
  Share2,
  FileCheck,
  Lightbulb,
  ShieldAlert,
  Percent,
  Cpu,
  Mic,
  MicOff,
  Paperclip
} from "lucide-react";
import { Message, Citation, PersonaMode } from "@/types";
import { PERSONA_CONFIGS } from "@/lib/gemini/personas";

interface ChatPanelProps {
  mode: PersonaMode;
  onSelectMode: (mode: PersonaMode) => void;
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onSelectCitation: (citation: Citation) => void;
  onOpenIngest: () => void;
  selectedSourcesCount: number;
  remainingQuota: number;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  mode,
  onSelectMode,
  messages,
  isLoading,
  onSendMessage,
  onSelectCitation,
  onOpenIngest,
  selectedSourcesCount,
  remainingQuota,
}) => {
  const [inputText, setInputText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const persona = PERSONA_CONFIGS[mode] || PERSONA_CONFIGS.mentor;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle Speech Recognition for voice typing
  useEffect(() => {
    if (isListening) {
      if (typeof window !== "undefined") {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          try {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onresult = (event: any) => {
              let transcript = "";
              for (let i = 0; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript + " ";
              }
              if (transcript.trim()) {
                setInputText(transcript.trim());
              }
            };

            recognition.onerror = (err: any) => {
              console.warn("Speech recognition error:", err);
              setIsListening(false);
            };

            recognition.onend = () => {
              setIsListening(false);
            };

            recognition.start();
            recognitionRef.current = recognition;
          } catch (e) {
            console.warn("Could not start SpeechRecognition in ChatPanel:", e);
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      }
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [isListening]);

  const toggleListening = () => {
    setIsListening((prev) => !prev);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    if (isListening) {
      setIsListening(false);
    }
    onSendMessage(inputText.trim());
    setInputText("");
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Render text with clickable citation superscripts [1], [2], [1, 2]
  const renderMessageContent = (content: string, citations?: Citation[]) => {
    if (!citations || citations.length === 0) {
      return <div className="whitespace-pre-wrap">{content}</div>;
    }

    const regex = /(\[\s*\d+(?:\s*,\s*\d+)*\s*\])/g;
    const parts = content.split(regex);

    return (
      <div className="whitespace-pre-wrap leading-relaxed">
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
    <section className="flex-1 flex flex-col h-full bg-[#07080d] overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.08] bg-[#090d1a]/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <h2 className="font-heading font-bold text-sm text-slate-100">
            Chat
          </h2>

          {/* Mode Selector Pill */}
          <div className="relative">
            <button
              onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
              className="flex items-center gap-1.5 rounded-full bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 px-3 py-1 text-xs font-semibold text-purple-300 transition-all shadow-sm"
            >
              <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
              <span>{persona.name}</span>
              <ChevronDown className="h-3 w-3 text-purple-400" />
            </button>

            {isModeDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-64 rounded-2xl border border-white/[0.12] bg-[#0c1022] shadow-2xl p-2 z-50 backdrop-blur-xl">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Switch LLM Persona
                </div>
                {Object.values(PERSONA_CONFIGS).map((p) => (
                  <button
                    key={p.mode}
                    onClick={() => {
                      onSelectMode(p.mode);
                      setIsModeDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                      mode === p.mode
                        ? "bg-purple-600/30 text-white font-semibold border border-purple-500/40"
                        : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                    }`}
                  >
                    <div>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-[10px] text-slate-400">{p.badge}</div>
                    </div>
                    {mode === p.mode && <Check className="h-3.5 w-3.5 text-purple-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-mono text-slate-400 border border-white/[0.08]">
            <Zap className="h-3 w-3 text-cyan-400" />
            <span>{remainingQuota}/40 rpm</span>
          </div>
        </div>
      </div>

      {/* Messages Feed / Empty State */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto space-y-5 py-8">
            <div className="h-14 w-14 rounded-3xl bg-gradient-to-tr from-purple-600/30 via-indigo-500/20 to-cyan-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-xl shadow-purple-500/10">
              <Sparkles className="h-7 w-7 text-purple-300" />
            </div>

            <div>
              <h3 className="font-heading text-lg font-bold text-white">
                Let&apos;s ground your mentor…
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Ask anything about hackathon rules, pitch rehearsal, architectural trade-offs, or scoring rubrics. Every answer is grounded directly in your uploaded project documents.
              </p>
            </div>

            {/* NotebookLM-style Suggestion Action Buttons */}
            <div className="w-full space-y-2 pt-2">
              <button
                onClick={onOpenIngest}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-purple-500/30 bg-[#0d1226]/80 hover:bg-purple-950/40 hover:border-purple-500 text-xs font-semibold text-purple-200 transition-all text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <FileCheck className="h-4 w-4 text-purple-400" />
                  <span>Upload your hackathon rules</span>
                </div>
                <Sparkles className="h-3.5 w-3.5 text-purple-400 opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => onSendMessage("What are the official scoring criteria, weights, and submission requirements?")}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-white/[0.08] bg-[#0c1020]/70 hover:bg-[#121832] hover:border-white/[0.15] text-xs font-semibold text-slate-200 transition-all text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="h-4 w-4 text-cyan-400" />
                  <span>Ask about scoring criteria</span>
                </div>
                <Sparkles className="h-3.5 w-3.5 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => {
                  onSelectMode("ideation");
                  onSendMessage("Brainstorm 3 radical killer features that will differentiate our project for hackathon judges.");
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-white/[0.08] bg-[#0c1020]/70 hover:bg-[#121832] hover:border-white/[0.15] text-xs font-semibold text-slate-200 transition-all text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                  <span>Start ideation mode</span>
                </div>
                <Sparkles className="h-3.5 w-3.5 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
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
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                    isUser
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                      : `bg-gradient-to-br ${persona.color} text-white shadow-md`
                  }`}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>

                <div
                  className={`flex flex-col space-y-2 max-w-[85%] sm:max-w-[78%] ${
                    isUser ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 text-xs ${
                      isUser
                        ? "bg-purple-600 text-white rounded-tr-none shadow-md shadow-purple-600/15"
                        : "glass-panel-subtle text-slate-200 rounded-tl-none border border-white/[0.08]"
                    }`}
                  >
                    {renderMessageContent(msg.content, msg.citations)}
                  </div>

                  {/* Grounded Source Strip with Match Rings */}
                  {!isUser && msg.citations && msg.citations.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      {msg.citations.map((c) => {
                        const matchPct = Math.round(c.score * 100);
                        return (
                          <button
                            key={c.chunk_id}
                            onClick={() => onSelectCitation(c)}
                            className="flex items-center gap-2 rounded-lg bg-[#0e1328] border border-purple-500/30 hover:border-purple-400 px-2.5 py-1 text-[11px] font-medium text-slate-200 transition-all hover:bg-purple-950/40 group shadow-sm"
                          >
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[9px] font-bold border border-cyan-500/40">
                              {c.citation_number}
                            </span>
                            <span className="truncate max-w-[130px]">
                              {c.source_doc}
                            </span>
                            <span className="font-mono text-cyan-300 text-[10px] font-bold">
                              {matchPct}%
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {!isUser && (
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 px-1">
                      {msg.tokens_used ? <span>{msg.tokens_used} tokens</span> : null}
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
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${persona.color} text-white animate-pulse`}
            >
              <Bot className="h-4 w-4" />
            </div>
            <div className="glass-panel-subtle rounded-2xl rounded-tl-none border border-white/[0.08] px-4 py-3 text-xs text-slate-300 flex items-center gap-2.5">
              <div className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Retrieving pgvector HNSW context & reasoning...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Input Bar */}
      <div className="border-t border-white/[0.08] bg-[#090d1a]/85 p-3 sm:p-4 backdrop-blur-xl z-20">
        {isListening && (
          <div className="max-w-4xl mx-auto mb-2 flex items-center justify-between px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs animate-pulse">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-semibold">Listening to voice input... speak clearly into your microphone</span>
            </div>
            <button
              type="button"
              onClick={() => setIsListening(false)}
              className="text-[11px] font-bold text-cyan-400 hover:text-white underline"
            >
              Stop
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-4xl mx-auto">
          {/* Attach / Ingest PDF or Voice Note Button */}
          <button
            type="button"
            onClick={onOpenIngest}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-[#0c1022] text-slate-400 hover:text-purple-300 hover:border-purple-500/40 hover:bg-purple-950/20 transition-all shadow-inner"
            title="Upload PDF, Voice Note, or text documentation into pgvector"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <div className="relative flex-1 flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? "Listening... (speech converted to text)" : "Ask a question, dictate with voice, or ground a new idea…"}
              className={`w-full rounded-2xl border bg-[#0c1022] pl-4 pr-28 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 transition-all shadow-inner ${
                isListening ? "border-cyan-500 ring-1 ring-cyan-500/50" : "border-white/[0.1] focus:border-purple-500 focus:ring-purple-500"
              }`}
              disabled={isLoading}
            />
            {/* Small Sources Selected Indicator inside input */}
            <div className="absolute right-3 flex items-center gap-1 rounded-md bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 text-[10px] font-mono text-purple-300 pointer-events-none">
              <Cpu className="h-2.5 w-2.5 text-cyan-400" />
              <span>{selectedSourcesCount} sources</span>
            </div>
          </div>

          {/* Voice Microphone Toggle Button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all shadow-md ${
              isListening
                ? "bg-cyan-500 text-slate-950 ring-2 ring-cyan-400/50 animate-pulse"
                : "border border-white/[0.08] bg-[#0c1022] text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 hover:bg-cyan-950/20"
            }`}
            title={isListening ? "Stop voice dictation" : "Dictate with voice (speech-to-text)"}
          >
            {isListening ? <Mic className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={isLoading || !inputText.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </section>
  );
};
