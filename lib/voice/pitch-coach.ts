import { getGeminiClient, withGeminiRetry, generateContentWithFallback } from "../gemini/client";
import { PitchFeedback } from "@/types";

/**
 * Evaluates a hackathon pitch transcript and generates structured feedback
 */
export async function evaluatePitchTranscript(params: {
  transcript: string;
  projectName: string;
  trackName?: string;
  durationSeconds?: number;
}): Promise<PitchFeedback> {
  const { transcript, projectName, trackName = "AI Innovation", durationSeconds = 180 } = params;
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  const prompt = `
You are the HackForge Pitch & Demo Coach.
Evaluate this hackathon pitch transcript for project "${projectName}" in track "${trackName}".
Pitch Duration: ${durationSeconds} seconds (Target: ~180 seconds).

=== PITCH TRANSCRIPT ===
${transcript}
========================

EVALUATE ACROSS:
1. Clarity Score (0-10): Is the core value proposition instantly obvious in the first 30 seconds?
2. Structure Score (0-10): Hook -> Problem -> Live Demo -> Architecture -> Market/Impact -> CTA.
3. Timing Score (0-10): Pacing, word density, risk of overtime.
4. Delivery Score (0-10): Persuasive language, conviction, avoidance of rambling or filler.
5. Strengths (top 3 highlights).
6. Critical Gaps (top 3 areas judges will attack).
7. Anticipated Judge Follow-up Questions (3 tough technical/business curveball questions).

Respond ONLY with a valid JSON object matching this schema:
{
  "clarity_score": 8.5,
  "structure_score": 9.0,
  "timing_score": 8.0,
  "delivery_score": 8.8,
  "key_strengths": ["...", "...", "..."],
  "critical_gaps": ["...", "...", "..."],
  "judge_followup_questions": ["...", "...", "..."],
  "overall_assessment": "Comprehensive summary here..."
}
`;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured. Pitch Coach requires an authentic Gemini connection.");
  }

  return await withGeminiRetry(async () => {
    const text = await generateContentWithFallback({
      prompt,
      generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
    });

    const parsed = JSON.parse(text);

    return {
      clarity_score: Number(parsed.clarity_score || 8.0),
      structure_score: Number(parsed.structure_score || 8.0),
      timing_score: Number(parsed.timing_score || 8.0),
      delivery_score: Number(parsed.delivery_score || 8.0),
      key_strengths: parsed.key_strengths || ["Compelling hook", "Clear demonstration", "Strong technical basis"],
      critical_gaps: parsed.critical_gaps || ["Elaborate on business viability", "Deepen offline edge resilience description"],
      judge_followup_questions: parsed.judge_followup_questions || [
        "How does the system handle extreme concurrent requests during a surge?",
        "What is the total cost of ownership for a pilot deployment?",
      ],
      overall_assessment: parsed.overall_assessment || "Strong pitch with good technical grounding.",
    };
  });
}
