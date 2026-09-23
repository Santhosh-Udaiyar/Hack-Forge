import { NextRequest, NextResponse } from "next/server";
import { extractDocumentText } from "@/lib/rag/extractor";
import { splitDocumentIntoChunks } from "@/lib/rag/chunker";
import { getBatchEmbeddings } from "@/lib/gemini/embedding";
import { mockDb } from "@/lib/supabase/mock-db";
import { createServerClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth/server-auth";
import { Document, DocumentChunk } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const textContent = formData.get("text") as string | null;
    const title = (formData.get("title") as string) || file?.name || "Untitled Document";
    const fileType = (formData.get("fileType") as any) || "hackathon_rules";
    const projectId = formData.get("projectId") as string;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    if (!file && !textContent) {
      return NextResponse.json({ error: "No file or text provided for ingestion" }, { status: 400 });
    }

    // Authenticate user
    const authUser = await getAuthenticatedUser(req);
    const userId = authUser?.id || (formData.get("userId") as string) || undefined;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required to ingest documents" },
        { status: 401 }
      );
    }

    let buffer: Buffer | string = "";
    let fileName = title;

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      fileName = file.name;
    } else if (textContent) {
      buffer = textContent;
    }

    // 1. Extract raw text from file / string
    const extracted = await extractDocumentText(buffer, fileName);

    // 2. Split into semantically preserved chunks
    const chunksData = await splitDocumentIntoChunks(extracted.text, {
      chunkSize: 600,
      chunkOverlap: 100,
    });

    const docId = `doc-${Date.now()}`;
    const docRecord: Document = {
      id: docId,
      project_id: projectId,
      user_id: userId,
      title,
      file_type: fileType,
      file_size: typeof buffer === "string" ? buffer.length : buffer.byteLength,
      status: "processing",
      chunk_count: chunksData.length,
      created_at: new Date().toISOString(),
    };

    // 3. Generate 768-dim embeddings in batches
    const chunkTexts = chunksData.map((c) => c.content);
    const embeddings = await getBatchEmbeddings(chunkTexts);

    // 4. Construct chunk records with user_id attached
    const chunkRecords: DocumentChunk[] = chunksData.map((c, idx) => ({
      id: `chunk-${docId}-${idx + 1}`,
      document_id: docId,
      project_id: projectId,
      user_id: userId,
      content: c.content,
      embedding: embeddings[idx],
      page_number: c.pageNumber || 1,
      char_start: c.charStart,
      char_end: c.charEnd,
      doc_title: title,
      doc_type: fileType,
      created_at: new Date().toISOString(),
    }));

    docRecord.status = "indexed";

    // 5. Store in Supabase or local mockDb
    const supabase = createServerClient();
    if (supabase) {
      try {
        await supabase.from("documents").insert([
          {
            project_id: docRecord.project_id,
            user_id: userId,
            title: docRecord.title,
            file_type: docRecord.file_type,
            file_size: docRecord.file_size,
            status: docRecord.status,
            chunk_count: docRecord.chunk_count,
            created_at: docRecord.created_at,
          },
        ]);

        await supabase.from("chunks").insert(
          chunkRecords.map((c) => ({
            document_id: docRecord.id,
            project_id: c.project_id,
            user_id: userId,
            content: c.content,
            embedding: c.embedding,
            page_number: c.page_number,
            char_start: c.char_start,
            char_end: c.char_end,
            doc_title: c.doc_title,
            doc_type: c.doc_type,
            created_at: c.created_at,
          }))
        );
      } catch (err) {
        console.warn("[HackForge Ingest] Supabase insert warning:", err);
      }
    }

    mockDb.documents.set(docRecord.id, docRecord);
    chunkRecords.forEach((c) => mockDb.chunks.set(c.id, c));

    return NextResponse.json({
      success: true,
      document: docRecord,
      chunkCount: chunkRecords.length,
      message: `Successfully indexed ${chunkRecords.length} chunks into 768-dim pgvector HNSW store.`,
    });
  } catch (err: any) {
    console.error("[HackForge Ingest] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to process and index document" },
      { status: 500 }
    );
  }
}
