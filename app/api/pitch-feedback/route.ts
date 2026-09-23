import { NextRequest, NextResponse } from "next/server";
import { evaluatePitchTranscript } from "@/lib/voice/pitch-coach";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      transcript,
      projectName = "MediPulse AI",
      trackName = "AI & Healthcare Innovation",
      durationSeconds = 180,
    } = body;

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "Transcript is required" }, { status: 400 });
    }

    const feedback = await evaluatePitchTranscript({
      transcript,
      projectName,
      trackName,
      durationSeconds,
    });

    return NextResponse.json({ success: true, feedback });
  } catch (err: any) {
    console.error("[HackForge Pitch Feedback API] Error:", err);
    return NextResponse.json({ error: err?.message || "Failed to analyze pitch transcript" }, { status: 500 });
  }
}
