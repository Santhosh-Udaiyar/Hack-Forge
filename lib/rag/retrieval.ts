import { getQueryEmbedding } from "../gemini/embedding";
import { createServerClient } from "../supabase/server";
import { mockDb } from "../supabase/mock-db";
import { Citation, DocumentChunk } from "@/types";

export interface RetrievalResult {
  chunks: DocumentChunk[];
  citations: Citation[];
  formattedContext: string;
  hasSufficientContext: boolean;
}

/**
 * Retrieve top-K relevant chunks with project-scoped metadata filtering and threshold gating
 */
export async function retrieveRelevantChunks(params: {
  query: string;
  projectId: string;
  userId?: string;
  docType?: string;
  topK?: number;
  similarityThreshold?: number;
}): Promise<RetrievalResult> {
  const {
    query,
    projectId,
    userId,
    docType,
    topK = 4,
    similarityThreshold = 0.55,
  } = params;

  // 1. Generate 768-dim query embedding
  const queryEmbedding = await getQueryEmbedding(query);

  let rawChunks: DocumentChunk[] = [];
  const supabase = createServerClient();

  if (supabase) {
    try {
      // Call PostgreSQL RPC with mandatory project_id and user_id filters
      const { data, error } = await supabase.rpc("match_document_chunks", {
        query_embedding: queryEmbedding,
        match_threshold: similarityThreshold,
        match_count: topK,
        filter_project_id: projectId,
        filter_user_id: userId || null,
        filter_doc_type: docType || null,
      });

      if (error) {
        console.warn("[HackForge RAG] Supabase RPC error, falling back to mockDb:", error.message);
        rawChunks = mockDb.matchDocumentChunks({
          queryEmbedding,
          queryText: query,
          matchThreshold: similarityThreshold,
          matchCount: topK,
          filterProjectId: projectId,
          filterUserId: userId,
          filterDocType: docType,
        });
      } else if (data) {
        rawChunks = data;
      }
    } catch (err) {
      console.warn("[HackForge RAG] Remote query failed, using local store:", err);
      rawChunks = mockDb.matchDocumentChunks({
        queryEmbedding,
        queryText: query,
        matchThreshold: similarityThreshold,
        matchCount: topK,
        filterProjectId: projectId,
        filterUserId: userId,
        filterDocType: docType,
      });
    }
  } else {
    // Local / offline mock database execution
    rawChunks = mockDb.matchDocumentChunks({
      queryEmbedding,
      queryText: query,
      matchThreshold: similarityThreshold,
      matchCount: topK,
      filterProjectId: projectId,
      filterUserId: userId,
      filterDocType: docType,
    });
  }

  // 2. Similarity threshold gating
  const gatedChunks = rawChunks.filter((c) => (c.similarity ?? 0) >= similarityThreshold);

  // 3. Build server-side citation map
  const citations: Citation[] = gatedChunks.map((c, idx) => ({
    chunk_id: c.id,
    citation_number: idx + 1,
    score: Math.round((c.similarity ?? 0.85) * 100) / 100,
    source_doc: c.doc_title || "Official Hackathon Documentation",
    page_number: c.page_number,
    char_start: c.char_start,
    char_end: c.char_end,
    excerpt: c.content.slice(0, 180) + (c.content.length > 180 ? "..." : ""),
  }));

  // 4. Build formatted context string for LLM injection
  const formattedContext = gatedChunks
    .map(
      (c, idx) =>
        `[${idx + 1}] Source: ${c.doc_title || "Hackathon Doc"} (Page ${c.page_number || 1}, Match: ${Math.round((c.similarity || 0.85) * 100)}%)\n${c.content}`
    )
    .join("\n\n");

  return {
    chunks: gatedChunks,
    citations,
    formattedContext,
    hasSufficientContext: gatedChunks.length > 0,
  };
}
