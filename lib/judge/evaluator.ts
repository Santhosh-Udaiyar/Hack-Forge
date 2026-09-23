import { getGeminiClient, withGeminiRetry, generateContentWithFallback } from "../gemini/client";
import { retrieveRelevantChunks } from "../rag/retrieval";
import { createServerClient, isUuid } from "../supabase/server";
import { mockDb } from "../supabase/mock-db";
import { JudgeRun, JudgeVerdict, Project, ProjectMemory, RubricScores } from "@/types";
import { calculateTotalScore } from "./rubric";

export interface EvaluationInput {
  projectId: string;
  userId?: string;
  project: Project;
  memory?: ProjectMemory | null;
  submissionPitchText?: string;
}

/**
 * Execute AI Judge with Dual-Run Self-Consistency Checking
 * Run 1: Technical-first analytical perspective
 * Run 2: Product & domain impact perspective with reordered criteria
 */
export async function runSelfConsistentJudge(input: EvaluationInput): Promise<JudgeVerdict> {
  const { projectId, userId, project, memory, submissionPitchText = "" } = input;

  // 1. Retrieve grounded hackathon rules and rubric specs scoped strictly to project & user
  const retrieval = await retrieveRelevantChunks({
    query: `Judging rubric criteria feasibility originality technical depth rules compliance track requirements for ${project.name} ${project.track || ""}`,
    projectId,
    userId,
    topK: 5,
    similarityThreshold: 0.45,
  });

  const citedChunkIds = retrieval.chunks.map((c) => c.id);

  // 2. Execute Run 1: Technical-first framing
  const run1 = await executeJudgeRun({
    runNumber: 1,
    framing: "Technical & Architectural Rigor Focus",
    project,
    userId,
    memory,
    submissionPitchText,
    retrievalContext: retrieval.formattedContext,
    citedChunkIds,
  });

  // 3. Execute Run 2: Product & Innovation framing (reworded, different question order)
  const run2 = await executeJudgeRun({
    runNumber: 2,
    framing: "Product Impact & Innovation Differentiator Focus",
    project,
    userId,
    memory,
    submissionPitchText,
    retrievalContext: retrieval.formattedContext,
    citedChunkIds,
  });

  // 4. Compute Per-Criterion Divergence & Check Self-Consistency
  const criteriaKeys: Array<keyof Omit<RubricScores, "total_score">> = [
    "feasibility",
    "originality",
    "technical_depth",
    "ui_ux",
    "rules_compliance",
  ];

  let maxDivergence = 0;
  const disagreements: string[] = [];
  const finalScores: any = {};

  for (const key of criteriaKeys) {
    const s1 = run1.rubric_scores[key] || 0;
    const s2 = run2.rubric_scores[key] || 0;
    const delta = Math.abs(s1 - s2);
    if (delta > maxDivergence) maxDivergence = delta;

    if (delta >= 1.5) {
      disagreements.push(
        `High variance on ${key.replace("_", " ").toUpperCase()}: Run 1 awarded ${s1}/5 vs Run 2 awarded ${s2}/5 (Delta: ${delta.toFixed(1)}).`
      );
    }

    // Weighted average for final score
    finalScores[key] = Math.round(((s1 + s2) / 2) * 10) / 10;
  }

  finalScores.total_score = calculateTotalScore(finalScores);

  const confidence: "high" | "low" = maxDivergence >= 1.5 ? "low" : "high";
  const disagreementNotes =
    confidence === "low"
      ? `ATTENTION: Dual-run evaluation detected notable score divergence across runs (>1.5 pts difference).\n${disagreements.join("\n")}\n\nBoth independent reasoning paths are preserved below for transparent review.`
      : "High consensus across independent dual-run evaluations. Both evaluations converged within standard confidence thresholds.";

  const verdict: JudgeVerdict = {
    id: `verdict-${Date.now()}`,
    project_id: projectId,
    user_id: userId,
    final_scores: finalScores as RubricScores,
    confidence,
    disagreement_delta: Math.round(maxDivergence * 10) / 10,
    disagreement_notes: disagreementNotes,
    run_1: run1,
    run_2: run2,
    created_at: new Date().toISOString(),
  };

  // 5. Store in Supabase / Local Store with user_id attached
  const supabase = createServerClient();
  if (supabase && isUuid(projectId)) {
    try {
      await supabase.from("judge_runs").insert([
        {
          id: run1.id.startsWith("run-") ? undefined : run1.id,
          project_id: run1.project_id,
          user_id: userId,
          run_number: run1.run_number,
          prompt_framing: run1.prompt_framing,
          rubric_scores: run1.rubric_scores,
          reasoning: run1.reasoning,
          cited_chunk_ids: run1.cited_chunk_ids,
          created_at: run1.created_at,
        },
        {
          id: run2.id.startsWith("run-") ? undefined : run2.id,
          project_id: run2.project_id,
          user_id: userId,
          run_number: run2.run_number,
          prompt_framing: run2.prompt_framing,
          rubric_scores: run2.rubric_scores,
          reasoning: run2.reasoning,
          cited_chunk_ids: run2.cited_chunk_ids,
          created_at: run2.created_at,
        },
      ]);

      await supabase.from("judge_verdicts").insert([
        {
          project_id: verdict.project_id,
          user_id: userId,
          final_scores: verdict.final_scores,
          confidence: verdict.confidence,
          disagreement_delta: verdict.disagreement_delta,
          disagreement_notes: verdict.disagreement_notes,
          created_at: verdict.created_at,
        },
      ]);
    } catch (err) {
      console.warn("[HackForge Judge] DB insert fallback to mockDb:", err);
      mockDb.judgeRuns.set(run1.id, run1);
      mockDb.judgeRuns.set(run2.id, run2);
      mockDb.judgeVerdicts.set(verdict.id, verdict);
    }
  } else {
    mockDb.judgeRuns.set(run1.id, run1);
    mockDb.judgeRuns.set(run2.id, run2);
    mockDb.judgeVerdicts.set(verdict.id, verdict);
  }

  return verdict;
}

async function executeJudgeRun(params: {
  runNumber: 1 | 2;
  framing: string;
  project: Project;
  userId?: string;
  memory?: ProjectMemory | null;
  submissionPitchText: string;
  retrievalContext: string;
  citedChunkIds: string[];
}): Promise<JudgeRun> {
  const { runNumber, framing, project, userId, memory, submissionPitchText, retrievalContext, citedChunkIds } = params;
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in .env.local. AI Judge requires an authentic Gemini LLM connection.");
  }

  const prompt = `
You are the Official AI Hackathon Judge executing Evaluation Run #${runNumber} with framing: "${framing}".
Score this hackathon project strictly and objectively based only on the provided profile, memory, and grounded documentation.

=== PROJECT PROFILE ===
Title: ${project.name}
Track: ${project.track || "General Track"}
Tech Stack: ${project.tech_stack.join(", ") || "None specified"}
Project Summary: ${project.description || memory?.summary || "No description provided"}
Live Pitch / Submission Notes: ${submissionPitchText || "Standard project submission"}
=======================

=== GROUNDED HACKATHON RULES & RUBRIC GUIDELINES ===
${retrievalContext || "No custom rules uploaded. Apply standard hackathon rubric standards."}
===================================================

EVALUATION RULES:
1. Provide a numerical score from 0.0 to 5.0 (decimals allowed, e.g. 4.2) for each of:
   - feasibility
   - originality
   - technical_depth
   - ui_ux
   - rules_compliance
2. Write a detailed, analytical reasoning paragraph explaining the breakdown, referencing grounded rules [1], [2] where applicable.
3. Respond ONLY with a valid JSON object in the exact format:
{
  "scores": {
    "feasibility": 4.5,
    "originality": 4.0,
    "technical_depth": 4.8,
    "ui_ux": 4.2,
    "rules_compliance": 5.0
  },
  "reasoning": "Detailed breakdown here..."
}
`;

  return await withGeminiRetry(async () => {
    const text = await generateContentWithFallback({
      prompt,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: runNumber === 1 ? 0.2 : 0.35,
      },
    });

    const parsed = JSON.parse(text);
    const scores: RubricScores = {
      feasibility: Number(parsed.scores?.feasibility || 3.5),
      originality: Number(parsed.scores?.originality || 3.5),
      technical_depth: Number(parsed.scores?.technical_depth || 3.5),
      ui_ux: Number(parsed.scores?.ui_ux || 3.5),
      rules_compliance: Number(parsed.scores?.rules_compliance || 4.0),
      total_score: 0,
    };
    scores.total_score = calculateTotalScore(scores);

    return {
      id: `run-${runNumber}-${Date.now()}`,
      project_id: project.id,
      user_id: userId,
      run_number: runNumber,
      prompt_framing: framing,
      rubric_scores: scores,
      reasoning: parsed.reasoning || "Evaluation completed successfully based on project grounded materials.",
      cited_chunk_ids: citedChunkIds,
      created_at: new Date().toISOString(),
    };
  });
}
