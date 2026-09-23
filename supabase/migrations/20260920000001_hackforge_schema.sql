-- ====================================================================
-- HACKFORGE: AI-Powered Hackathon Mentor & Judge Platform
-- Corrected & Idempotent Supabase Migration
-- Combines: NOT NULL integrity (Doc 1) + status CHECK constraint (Doc 2)
--           + idempotent policies (safe to re-run anytime)
-- ====================================================================

-- 1. Enable pgvector Extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Projects Table with user_id Owner
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    track TEXT,
    summary TEXT,
    description TEXT,
    tech_stack TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'ideation' CHECK (status IN ('ideation', 'in_progress', 'submitted', 'judged')),
    message_count INT DEFAULT 0,
    sources_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Documents Table with project_id and user_id scoping
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'hackathon_rules' | 'project_spec' | 'technical_doc'
    file_path TEXT,
    file_size INT,
    status TEXT DEFAULT 'pending', -- 'pending' | 'processing' | 'indexed' | 'failed'
    chunk_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Document Chunks (768-dim Vector with HNSW Cosine Index)
CREATE TABLE IF NOT EXISTS chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding VECTOR(768) NOT NULL,
    page_number INT,
    char_start INT,
    char_end INT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW Vector Index with Cosine Distance
CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw_idx
ON chunks USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Composite Index for fast pre-filtering by user, project & document
CREATE INDEX IF NOT EXISTS chunks_user_project_idx
ON chunks (user_id, project_id, document_id);

-- 5. Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mode TEXT NOT NULL,
    title TEXT DEFAULT 'New Conversation',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Messages Table with Structured Jsonb Citations
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]'::jsonb,
    tokens_used INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. AI Judge Runs
CREATE TABLE IF NOT EXISTS judge_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    run_number INT NOT NULL,
    prompt_framing TEXT NOT NULL,
    rubric_scores JSONB NOT NULL,
    reasoning TEXT NOT NULL,
    cited_chunk_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. AI Judge Verdicts
CREATE TABLE IF NOT EXISTS judge_verdicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    final_scores JSONB NOT NULL,
    confidence TEXT NOT NULL CHECK (confidence IN ('high', 'low')),
    disagreement_delta FLOAT NOT NULL DEFAULT 0.0,
    disagreement_notes TEXT,
    run_1_id UUID REFERENCES judge_runs(id),
    run_2_id UUID REFERENCES judge_runs(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Project Memory Table
CREATE TABLE IF NOT EXISTS project_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    summary TEXT NOT NULL DEFAULT '',
    key_facts JSONB DEFAULT '{"tech_stack":[], "constraints":[], "target_user":"", "stage":"ideation"}'::jsonb,
    milestones JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE judge_verdicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_memory ENABLE ROW LEVEL SECURITY;

-- Idempotent Policies: drop-then-create so this script is safe to re-run
DROP POLICY IF EXISTS "User project isolation" ON projects;
CREATE POLICY "User project isolation" ON projects
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User document isolation" ON documents;
CREATE POLICY "User document isolation" ON documents
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User chunk isolation" ON chunks;
CREATE POLICY "User chunk isolation" ON chunks
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User conversation isolation" ON conversations;
CREATE POLICY "User conversation isolation" ON conversations
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User message isolation" ON messages;
CREATE POLICY "User message isolation" ON messages
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User judge run isolation" ON judge_runs;
CREATE POLICY "User judge run isolation" ON judge_runs
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User judge verdict isolation" ON judge_verdicts;
CREATE POLICY "User judge verdict isolation" ON judge_verdicts
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User memory isolation" ON project_memory;
CREATE POLICY "User memory isolation" ON project_memory
    FOR ALL USING (auth.uid() = user_id);

-- 11. Vector Search Function
CREATE OR REPLACE FUNCTION match_document_chunks (
    query_embedding VECTOR(768),
    match_threshold FLOAT,
    match_count INT,
    filter_project_id UUID,
    filter_user_id UUID DEFAULT NULL,
    filter_doc_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    project_id UUID,
    content TEXT,
    page_number INT,
    char_start INT,
    char_end INT,
    similarity FLOAT,
    doc_title TEXT,
    doc_type TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.document_id,
        c.project_id,
        c.content,
        c.page_number,
        c.char_start,
        c.char_end,
        1 - (c.embedding <=> query_embedding) AS similarity,
        d.title AS doc_title,
        d.file_type AS doc_type
    FROM chunks c
    JOIN documents d ON c.document_id = d.id
    WHERE c.project_id = filter_project_id
      AND (filter_user_id IS NULL OR c.user_id = filter_user_id)
      AND (filter_doc_type IS NULL OR d.file_type = filter_doc_type)
      AND (1 - (c.embedding <=> query_embedding)) >= match_threshold
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
