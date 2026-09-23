"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Mic, 
  Play, 
  Square, 
  Award, 
  AlertCircle, 
  HelpCircle, 
  RotateCw
} from "lucide-react";
import { PitchFeedback } from "@/types";

interface VoicePitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
}

export const VoicePitchModal: React.FC<VoicePitchModalProps> = ({
  isOpen,
  onClose,
  projectName,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(180); // 3 minutes standard
  const [transcript, setTranscript] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<PitchFeedback | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleStopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Simulate audio waveform animation
      const waveInterval = setInterval(() => {
        setAudioLevel(Math.random() * 80 + 20);
      }, 120);

      // Initialize Browser Web Speech API if supported
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
              setTranscript(currentTranscript.trim());
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
        if (timerRef.current) clearInterval(timerRef.current);
        clearInterval(waveInterval);
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch {}
        }
      };
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setAudioLevel(0);
    }
  }, [isRecording]);

  if (!isOpen) return null;

  const handleStartRecording = () => {
    setIsRecording(true);
    setTimerSeconds(180);
    setFeedback(null);
    setTranscript("");
  };

  const handleStopRecording = async () => {
    setIsRecording(false);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    setIsEvaluating(true);

    try {
      const res = await fetch("/api/pitch-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: transcript || "Live hackathon project demonstration with technical architecture overview.",
          projectName,
          durationSeconds: 180 - timerSeconds,
        }),
      });

      const data = await res.json();
      if (data.feedback) {
        setFeedback(data.feedback);
      }
    } catch (err) {
      console.error("Pitch evaluation error:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl rounded-3xl border border-white/[0.1] bg-[#0b1021] shadow-2xl p-6 space-y-6 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Mic className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-base text-white">
                Live Voice Pitch Practice (Gemini Live Mode)
              </h2>
              <p className="text-xs text-slate-400">
                Timed 3-minute pitch rehearsal with structured written feedback & judge defense questions
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Audio Visualizer & Timer */}
        <div className="rounded-2xl border border-white/[0.08] bg-slate-900/60 p-6 flex flex-col items-center justify-center space-y-4 relative overflow-hidden">
          {/* Circular Countdown Timer */}
          <div className="flex flex-col items-center">
            <span
              className={`font-mono text-4xl font-extrabold tracking-wider ${
                timerSeconds < 30 ? "text-rose-400 animate-pulse" : "text-cyan-400"
              }`}
            >
              {formattedTime}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 uppercase font-semibold">
              3-Minute Hackathon Demo Limit
            </span>
          </div>

          {/* Audio Waveform Bars */}
          <div className="flex items-center justify-center gap-1.5 h-12 w-full max-w-xs">
            {Array.from({ length: 18 }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full bg-cyan-400 transition-all duration-75"
                style={{
                  height: isRecording ? `${Math.max(8, (audioLevel * ((i % 5) + 1)) / 4)}px` : "6px",
                  opacity: isRecording ? 0.9 : 0.2,
                }}
              />
            ))}
          </div>

          {/* Recording Controls */}
          <div className="flex items-center gap-3">
            {!isRecording ? (
              <button
                onClick={handleStartRecording}
                className="flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition-all hover:bg-cyan-400"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Start Practice Pitch</span>
              </button>
            ) : (
              <button
                onClick={handleStopRecording}
                className="flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-rose-600/25 transition-all hover:bg-rose-500"
              >
                <Square className="h-4 w-4 fill-current" />
                <span>Finish & Grade Pitch</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Transcript / Feedback Section */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Transcript preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pitch Transcript (Speak into mic or type pitch notes)
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Start speaking into your mic, or type your pitch bullets and value proposition here..."
              rows={3}
              className="w-full rounded-xl border border-white/[0.08] bg-slate-950/80 p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>

          {/* Loading Evaluation */}
          {isEvaluating && (
            <div className="rounded-xl border border-white/[0.08] bg-slate-900/60 p-6 flex items-center justify-center gap-3 text-xs text-cyan-300">
              <RotateCw className="h-4 w-4 animate-spin" />
              <span>Pitch Coach analyzing storytelling structure, pacing & judge curveballs...</span>
            </div>
          )}

          {/* Structured Feedback Card */}
          {feedback && !isEvaluating && (
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-cyan-800/40 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  Pitch Coach Report Card
                </span>
                <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-xs font-bold text-cyan-300 border border-cyan-500/40">
                  Overall: {feedback.delivery_score}/10
                </span>
              </div>

              {/* Score Badges */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="rounded-lg bg-slate-900/80 p-2 border border-white/[0.08]">
                  <div className="text-[10px] text-slate-400">Clarity</div>
                  <div className="font-bold text-white mt-0.5">{feedback.clarity_score}/10</div>
                </div>
                <div className="rounded-lg bg-slate-900/80 p-2 border border-white/[0.08]">
                  <div className="text-[10px] text-slate-400">Structure</div>
                  <div className="font-bold text-white mt-0.5">{feedback.structure_score}/10</div>
                </div>
                <div className="rounded-lg bg-slate-900/80 p-2 border border-white/[0.08]">
                  <div className="text-[10px] text-slate-400">Timing</div>
                  <div className="font-bold text-white mt-0.5">{feedback.timing_score}/10</div>
                </div>
                <div className="rounded-lg bg-slate-900/80 p-2 border border-white/[0.08]">
                  <div className="text-[10px] text-slate-400">Delivery</div>
                  <div className="font-bold text-white mt-0.5">{feedback.delivery_score}/10</div>
                </div>
              </div>

              {/* Strengths & Gaps */}
              <div className="space-y-3 text-xs">
                <div>
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                    <Award className="h-3.5 w-3.5" /> Key Strengths
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300">
                    {feedback.key_strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                    <AlertCircle className="h-3.5 w-3.5" /> Critical Gaps to Fix
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300">
                    {feedback.critical_gaps.map((g, idx) => (
                      <li key={idx}>{g}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="font-bold text-purple-400 flex items-center gap-1.5 mb-1">
                    <HelpCircle className="h-3.5 w-3.5" /> Tough Judge Q&A Curveballs to Rehearse
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-purple-200">
                    {feedback.judge_followup_questions.map((q, idx) => (
                      <li key={idx} className="font-medium">{q}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
