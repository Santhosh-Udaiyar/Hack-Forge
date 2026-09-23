"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, StickyNote, Sparkles, Send } from "lucide-react";

export interface ProjectNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface ProjectNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: ProjectNote[];
  onAddNote: (title: string, content: string) => void;
  onDeleteNote: (id: string) => void;
  onInjectIntoChat: (noteContent: string) => void;
}

export const ProjectNotesModal: React.FC<ProjectNotesModalProps> = ({
  isOpen,
  onClose,
  notes,
  onAddNote,
  onDeleteNote,
  onInjectIntoChat,
}) => {
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    onAddNote(newTitle.trim() || "Project Scratchpad Note", newContent.trim());
    setNewTitle("");
    setNewContent("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-xl rounded-3xl border border-white/[0.1] bg-[#0c1022] shadow-2xl p-6 space-y-5 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <StickyNote className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-white">
                Project Studio Notes & Scratchpad
              </h3>
              <p className="text-[11px] text-slate-400">
                Save ideas, architectural bullets, and pitch hooks
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

        {/* Add Note Form */}
        <form onSubmit={handleSave} className="space-y-3 rounded-2xl border border-white/[0.08] bg-[#080b18]/80 p-4">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Note title (e.g. 3-minute pitch hook idea)..."
            className="w-full rounded-xl border border-white/[0.08] bg-[#0e1328] px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Write your project notes, feedback from mentors, or architecture decisions here..."
            rows={3}
            className="w-full rounded-xl border border-white/[0.08] bg-[#0e1328] p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 font-sans"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newContent.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-purple-600/25 hover:bg-purple-500 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Save Note</span>
            </button>
          </div>
        </form>

        {/* Notes Feed */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {notes.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500">
              No notes saved yet. Add your first note above.
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="rounded-2xl border border-white/[0.08] bg-[#0e1328]/90 p-4 space-y-2 text-xs relative group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{note.title}</span>
                  <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        onInjectIntoChat(note.content);
                        onClose();
                      }}
                      className="flex items-center gap-1 rounded-md bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 text-[10px] text-purple-300 hover:bg-purple-900"
                      title="Send to Chat"
                    >
                      <Send className="h-2.5 w-2.5" />
                      <span>Send to Chat</span>
                    </button>
                    <button
                      onClick={() => onDeleteNote(note.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete Note"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-slate-300 text-[11px] leading-relaxed">
                  {note.content}
                </p>
                <div className="text-[9px] font-mono text-slate-500 pt-1">
                  {new Date(note.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
