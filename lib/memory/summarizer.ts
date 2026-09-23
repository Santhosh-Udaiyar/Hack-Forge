import { getGeminiClient, withGeminiRetry, generateContentWithFallback } from "../gemini/client";
import { createServerClient, isUuid } from "../supabase/server";
import { mockDb } from "../supabase/mock-db";
import { Message, ProjectMemory } from "@/types";

/**
 * Summarizes recent conversation history and extracts structured key facts into persistent project memory
 */
export async function updateProjectMemory(params: {
  projectId: string;
  userId?: string;
  existingMemory?: ProjectMemory | null;
  newMessages: Message[];
}): Promise<ProjectMemory> {
  const { projectId, userId, existingMemory, newMessages } = params;
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  const conversationTranscript = newMessages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  const prompt = `
You are the HackForge Project Memory & State Manager.
Your job is to update the long-term compressed memory and structured facts for a hackathon team.

=== PREVIOUS MEMORY SUMMARY ===
${existingMemory?.summary || "No previous summary recorded."}
Current Facts: ${JSON.stringify(existingMemory?.key_facts || {})}
================================

=== NEW CONVERSATION SESSION ===
${conversationTranscript}
================================

TASKS:
1. Generate an updated, concise 2-3 paragraph summary capturing the core project vision, latest architectural decisions, and current blockers.
2. Extract updated structured key facts (tech stack items, constraints, target user, current stage).
3. Respond ONLY with a valid JSON object matching this schema:
{
  "summary": "Updated 2-3 paragraph summary...",
  "key_facts": {
    "tech_stack": ["Next.js", "Gemini", "..."],
    "constraints": ["Under 500ms latency", "..."],
    "target_user": "ER Nurses and triage staff",
    "stage": "prototyping"
  }
}
`;

  let updatedSummary = existingMemory?.summary || "Project progressing through active development.";
  let updatedFacts = existingMemory?.key_facts || {
    tech_stack: ["Next.js", "TypeScript", "Tailwind CSS"],
    constraints: ["48-hour deadline"],
    target_user: "Hackathon Judges & Users",
    stage: "prototyping" as const,
  };

  if (apiKey) {
    try {
      const response = await withGeminiRetry(async () => {
        return await generateContentWithFallback({
          prompt,
          generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
        });
      });

      const parsed = JSON.parse(response);
      if (parsed.summary) updatedSummary = parsed.summary;
      if (parsed.key_facts) updatedFacts = { ...updatedFacts, ...parsed.key_facts };
    } catch (err) {
      console.warn("[HackForge Memory] Summarizer LLM warning:", err);
    }
  }

  const memoryRecord: ProjectMemory = {
    id: existingMemory?.id || `mem-${Date.now()}`,
    project_id: projectId,
    user_id: userId,
    summary: updatedSummary,
    key_facts: updatedFacts,
    milestones: existingMemory?.milestones || [
      { title: "Project Scaffolding & Setup", completed: true },
      { title: "Core RAG Engine Integration", completed: true },
      { title: "AI Judge & Persona Verification", completed: true },
      { title: "Final Live Pitch Rehearsal", completed: false },
    ],
    updated_at: new Date().toISOString(),
  };

  // Persist to DB or mockDb
  const supabase = createServerClient();
  if (supabase && isUuid(projectId)) {
    try {
      await supabase.from("project_memory").upsert({
        project_id: memoryRecord.project_id,
        user_id: userId,
        summary: memoryRecord.summary,
        key_facts: memoryRecord.key_facts,
        milestones: memoryRecord.milestones,
        updated_at: memoryRecord.updated_at,
      });
    } catch (err) {
      console.warn("[HackForge Memory] Upsert to DB warning:", err);
      mockDb.projectMemories.set(projectId, memoryRecord);
    }
  } else {
    mockDb.projectMemories.set(projectId, memoryRecord);
  }

  return memoryRecord;
}
