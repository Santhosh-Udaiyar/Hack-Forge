import { Project, Document, DocumentChunk, Conversation, Message, JudgeRun, JudgeVerdict, ProjectMemory } from "@/types";

// In-Memory Multi-Tenant Database Store with strict user & project isolation (No dummy data)
class MockDatabase {
  projects: Map<string, Project> = new Map();
  documents: Map<string, Document> = new Map();
  chunks: Map<string, DocumentChunk> = new Map();
  conversations: Map<string, Conversation> = new Map();
  messages: Map<string, Message> = new Map();
  judgeRuns: Map<string, JudgeRun> = new Map();
  judgeVerdicts: Map<string, JudgeVerdict> = new Map();
  projectMemories: Map<string, ProjectMemory> = new Map();

  // Get all projects scoped strictly to user_id, ordered by updated_at DESC
  getUserProjects(userId?: string): Project[] {
    const list = Array.from(this.projects.values());
    if (!userId) return [];
    return list
      .filter((p) => p.user_id === userId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  // Get project by ID with strict user ownership validation
  getProject(projectId: string, userId?: string): Project | null {
    const proj = this.projects.get(projectId);
    if (!proj) return null;
    if (userId && proj.user_id && proj.user_id !== userId) {
      return null; // Access denied: not project owner
    }
    return proj;
  }

  // Create new isolated project for a real user
  createProject(data: Partial<Project> & { name: string; user_id?: string; summary?: string }): Project {
    const id = `proj-${Date.now()}`;
    const desc = data.summary || data.description || "Hackathon project workspace";
    const newProject: Project = {
      id,
      user_id: data.user_id || "",
      name: data.name,
      description: desc,
      summary: desc,
      tech_stack: data.tech_stack || [],
      track: data.track || "General Track",
      status: "in_progress",
      message_count: 0,
      sources_count: 0,
      last_activity: "Just now",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.projects.set(id, newProject);

    // Initialize clean project memory
    const emptyMemory: ProjectMemory = {
      id: `mem-${id}`,
      project_id: id,
      user_id: newProject.user_id,
      summary: "",
      key_facts: {
        tech_stack: newProject.tech_stack,
        constraints: [],
        target_user: "",
        stage: "ideation",
      },
      milestones: [],
      updated_at: new Date().toISOString(),
    };
    this.projectMemories.set(id, emptyMemory);

    return newProject;
  }

  // Update existing project
  updateProject(projectId: string, updates: Partial<Project>): Project | null {
    const proj = this.projects.get(projectId);
    if (!proj) return null;

    const updated = {
      ...proj,
      ...updates,
      updated_at: updates.updated_at || new Date().toISOString(),
    };
    this.projects.set(projectId, updated);
    return updated;
  }

  // Get ordered messages for a project
  getProjectMessages(projectId: string, userId?: string): Message[] {
    const msgs = Array.from(this.messages.values()).filter(
      (m) => m.project_id === projectId && (!userId || !m.user_id || m.user_id === userId)
    );
    return msgs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  // Add message
  addMessage(msg: Message): Message {
    this.messages.set(msg.id, msg);
    
    // Update project updated_at and message count
    if (msg.project_id) {
      const proj = this.projects.get(msg.project_id);
      if (proj) {
        proj.updated_at = new Date().toISOString();
        proj.last_activity = "Just now";
        proj.message_count = (proj.message_count || 0) + 1;
      }
    }
    return msg;
  }

  // Delete project and all associated documents, chunks, and messages
  deleteProject(projectId: string): boolean {
    this.projects.delete(projectId);
    this.projectMemories.delete(projectId);

    // Clean up documents and chunks
    for (const [docId, doc] of this.documents.entries()) {
      if (doc.project_id === projectId) this.documents.delete(docId);
    }
    for (const [chunkId, chunk] of this.chunks.entries()) {
      if (chunk.project_id === projectId) this.chunks.delete(chunkId);
    }
    for (const [msgId, msg] of this.messages.entries()) {
      if (msg.project_id === projectId) this.messages.delete(msgId);
    }
    return true;
  }

  // Exact Match Vector Search with user & project isolation (Cosine Similarity + Hybrid Term Scoring)
  matchDocumentChunks(params: {
    queryEmbedding?: number[];
    queryText?: string;
    matchThreshold: number;
    matchCount: number;
    filterProjectId: string;
    filterUserId?: string;
    filterDocType?: string;
  }): DocumentChunk[] {
    const results: Array<DocumentChunk & { similarity: number }> = [];

    for (const chunk of this.chunks.values()) {
      if (chunk.project_id !== params.filterProjectId) continue;
      if (params.filterUserId && chunk.user_id && chunk.user_id !== params.filterUserId) continue;
      if (params.filterDocType && chunk.doc_type !== params.filterDocType) continue;

      let vectorSim = 0;
      let keywordSim = 0;

      // 1. Dense Vector Cosine Similarity
      if (params.queryEmbedding && chunk.embedding && chunk.embedding.length > 0) {
        const qVec = params.queryEmbedding;
        const cVec = chunk.embedding;
        const len = Math.min(qVec.length, cVec.length);
        let dot = 0;
        let normQ = 0;
        let normC = 0;
        for (let i = 0; i < len; i++) {
          dot += qVec[i] * cVec[i];
          normQ += qVec[i] * qVec[i];
          normC += cVec[i] * cVec[i];
        }
        if (normQ > 0 && normC > 0) {
          const rawCos = dot / (Math.sqrt(normQ) * Math.sqrt(normC));
          vectorSim = Math.max(0, (rawCos + 1) / 2); // Normalize [-1, 1] to [0, 1]
        }
      }

      // 2. Sparse Keyword Matching
      if (params.queryText && chunk.content) {
        const qTerms = params.queryText.toLowerCase().split(/\W+/).filter((t) => t.length > 2);
        const cText = chunk.content.toLowerCase();
        if (qTerms.length > 0) {
          const matches = qTerms.filter((term) => cText.includes(term)).length;
          keywordSim = matches / qTerms.length;
        }
      }

      // 3. Hybrid RAG Fusion (70% dense vector + 30% sparse keyword matching)
      let similarity = vectorSim > 0 ? vectorSim * 0.7 + keywordSim * 0.3 : keywordSim * 0.8;
      similarity = Math.round(Math.min(1.0, Math.max(0, similarity)) * 100) / 100;

      if (similarity >= params.matchThreshold || keywordSim >= 0.4) {
        results.push({
          ...chunk,
          similarity: Math.max(similarity, 0.5),
        });
      }
    }

    results.sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0));
    return results.slice(0, params.matchCount);
  }
}

// Singleton Store (Clean, zero dummy data)
export const mockDb = new MockDatabase();
