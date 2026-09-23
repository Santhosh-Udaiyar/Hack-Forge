import { NextRequest, NextResponse } from "next/server";
import { rateLimiter } from "@/lib/ratelimit/limiter";
import { retrieveRelevantChunks } from "@/lib/rag/retrieval";
import { buildPromptWithContext, PERSONA_CONFIGS } from "@/lib/gemini/personas";
import { getGeminiClient, withGeminiRetry, generateContentWithFallback } from "@/lib/gemini/client";
import { mockDb } from "@/lib/supabase/mock-db";
import { createServerClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth/server-auth";
import { Message, PersonaMode } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      projectId,
      mode = "mentor" as PersonaMode,
      message,
      conversationId = `conv-${Date.now()}`,
    } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // 1. Verify Authenticated User
    const authUser = await getAuthenticatedUser(req);
    const userId = authUser?.id || body.userId || undefined;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to send messages." },
        { status: 401 }
      );
    }

    // 2. Application-level Rate Limiting per Project/Team
    const rateCheck = rateLimiter.check(projectId);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Rate limit reached. Please wait ${Math.ceil(rateCheck.resetMs / 1000)}s before sending more queries.`,
        },
        { status: 429 }
      );
    }

    // 3. Fetch Project Memory Scoped to User & Project
    let memory = mockDb.projectMemories.get(projectId);
    const supabase = createServerClient();
    if (supabase) {
      let query = supabase.from("project_memory").select("*").eq("project_id", projectId);
      if (userId) {
        query = query.eq("user_id", userId);
      }
      const { data } = await query.maybeSingle();
      if (data) memory = data;
    }

    // 4. RAG Retrieval Scoped Strictly to Project & User
    const personaMode = (mode || "mentor") as PersonaMode;
    const personaConfig = PERSONA_CONFIGS[personaMode] || PERSONA_CONFIGS.mentor;
    let retrievalResult = {
      chunks: [] as any[],
      citations: [] as any[],
      formattedContext: "",
      hasSufficientContext: false,
    };

    if (personaConfig.groundingRequired) {
      retrievalResult = await retrieveRelevantChunks({
        query: message,
        projectId,
        userId,
        topK: 4,
        similarityThreshold: 0.50,
      });
    }

    // 5. Build isolated persona prompt with memory & numbered citations
    const { systemPrompt, userPrompt } = buildPromptWithContext({
      mode,
      userMessage: message,
      projectMemory: memory,
      groundedChunks: retrievalResult.chunks.map((c) => ({
        id: c.id,
        content: c.content,
        docTitle: c.doc_title,
        pageNumber: c.page_number,
      })),
    });

    // 6. Execute Genuine Gemini LLM Generation (Never mock or fake responses)
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured. Please set GEMINI_API_KEY in .env.local to enable AI generation." },
        { status: 500 }
      );
    }

    const replyText = await withGeminiRetry(async () => {
      return await generateContentWithFallback({
        prompt: userPrompt,
        systemInstruction: systemPrompt,
        generationConfig: {
          temperature: personaConfig.temperature,
          maxOutputTokens: 1000,
        },
      });
    });

    const tokensEstimated = Math.round((systemPrompt.length + userPrompt.length + replyText.length) / 4);

    // 7. Map inline citation numbers [1], [2] to returned citations (only genuine cited sources)
    const detectedCitations = retrievalResult.citations.filter((cit) =>
      replyText.includes(`[${cit.citation_number}]`)
    );

    const now = new Date().toISOString();

    const userMessageObj: Message = {
      id: `usr-${Date.now()}`,
      conversation_id: conversationId,
      project_id: projectId,
      user_id: userId,
      role: "user",
      content: message,
      created_at: now,
    };

    const assistantMessage: Message = {
      id: `msg-${Date.now() + 1}`,
      conversation_id: conversationId,
      project_id: projectId,
      user_id: userId,
      role: "assistant",
      content: replyText,
      citations: detectedCitations,
      tokens_used: tokensEstimated,
      created_at: new Date(Date.now() + 100).toISOString(),
    };

    // Store in mockDb
    mockDb.addMessage(userMessageObj);
    mockDb.addMessage(assistantMessage);

    // Persist to Supabase with user_id enforcement
    if (supabase) {
      try {
        await supabase.from("messages").insert([
          {
            project_id: projectId,
            user_id: userId,
            role: "user",
            content: message,
            created_at: userMessageObj.created_at,
          },
          {
            project_id: projectId,
            user_id: userId,
            role: "assistant",
            content: replyText,
            citations: detectedCitations,
            tokens_used: tokensEstimated,
            created_at: assistantMessage.created_at,
          },
        ]);

        // Keep updated_at accurate
        await supabase
          .from("projects")
          .update({
            updated_at: now,
            last_activity: "Just now",
          })
          .eq("id", projectId)
          .eq("user_id", userId);
      } catch (err) {
        console.warn("[HackForge Chat API] Supabase message insert/update error:", err);
      }
    }

    return NextResponse.json({
      message: assistantMessage,
      citations: assistantMessage.citations,
      tokensUsed: tokensEstimated,
      remainingRequests: rateCheck.remaining,
      mode,
    });
  } catch (err: any) {
    console.error("[HackForge Chat API] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error occurred during chat processing." },
      { status: 500 }
    );
  }
}
