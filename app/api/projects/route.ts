import { NextRequest, NextResponse } from "next/server";
import { mockDb } from "@/lib/supabase/mock-db";
import { createServerClient, isUuid } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth/server-auth";
import { Project } from "@/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const authUser = await getAuthenticatedUser(req);
  const userId = authUser?.id || searchParams.get("userId") || undefined;

  const supabase = createServerClient();

  if (projectId) {
    let project = mockDb.getProject(projectId, userId);
    let docs = Array.from(mockDb.documents.values()).filter(
      (d) => d.project_id === projectId && (!userId || !d.user_id || d.user_id === userId)
    );
    let messages = mockDb.getProjectMessages(projectId, userId);
    let memory = mockDb.projectMemories.get(projectId) || null;

    if (supabase && isUuid(projectId)) {
      try {
        let projQuery = supabase.from("projects").select("*").eq("id", projectId);
        if (userId) {
          projQuery = projQuery.eq("user_id", userId);
        }
        const { data: projData, error: projErr } = await projQuery.maybeSingle();
        if (projData) {
          project = projData;
        }

        let docQuery = supabase.from("documents").select("*").eq("project_id", projectId);
        if (userId) {
          docQuery = docQuery.eq("user_id", userId);
        }
        const { data: docData } = await docQuery;
        if (docData) docs = docData;

        let msgQuery = supabase
          .from("messages")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: true });
        if (userId) {
          msgQuery = msgQuery.eq("user_id", userId);
        }
        const { data: msgData } = await msgQuery;
        if (msgData) messages = msgData;

        let memQuery = supabase.from("project_memory").select("*").eq("project_id", projectId);
        if (userId) {
          memQuery = memQuery.eq("user_id", userId);
        }
        const { data: memData } = await memQuery.maybeSingle();
        if (memData) memory = memData;
      } catch (err) {
        console.warn("[HackForge Projects API] DB fetch single error:", err);
      }
    }

    if (!project) {
      // Initialize fallback project record for client workspace continuity
      project = mockDb.createProject({
        name: "Hackathon Project Workspace",
        summary: "Hackathon project workspace & mentor session",
        description: "Hackathon project workspace & mentor session",
        user_id: userId || "",
      });
      project.id = projectId;
      mockDb.projects.set(projectId, project);
    }

    return NextResponse.json({
      project,
      documents: docs,
      messages,
      memory,
    });
  }

  // Get all projects scoped strictly to user_id
  let projects = mockDb.getUserProjects(userId);
  let documents = Array.from(mockDb.documents.values()).filter((d) => !userId || d.user_id === userId);
  let chunks = Array.from(mockDb.chunks.values()).filter((c) => !userId || c.user_id === userId);

  if (supabase) {
    try {
      let query = supabase.from("projects").select("*").order("updated_at", { ascending: false });
      if (userId) {
        query = query.eq("user_id", userId);
      }
      const { data: projData } = await query;
      if (projData) projects = projData;

      let docQuery = supabase.from("documents").select("*");
      if (userId) {
        docQuery = docQuery.eq("user_id", userId);
      }
      const { data: docData } = await docQuery;
      if (docData) documents = docData;

      let chunkQuery = supabase.from("chunks").select("*");
      if (userId) {
        chunkQuery = chunkQuery.eq("user_id", userId);
      }
      const { data: chunkData } = await chunkQuery;
      if (chunkData) chunks = chunkData;
    } catch (err) {
      console.warn("[HackForge Projects API] DB fetch all error:", err);
    }
  }

  return NextResponse.json({
    projects,
    documents,
    chunksCount: chunks.length,
    activeProjectId: projects[0]?.id || null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, summary, description, track, tech_stack } = body;

    const authUser = await getAuthenticatedUser(req);
    const userId = authUser?.id || body.user_id || body.userId;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "Authenticated user ID is required to create a project" }, { status: 401 });
    }

    const projectSummary = (summary || description || "Hackathon project workspace").trim();

    const newProject = mockDb.createProject({
      name: name.trim(),
      summary: projectSummary,
      description: projectSummary,
      track: track || "General Track",
      tech_stack: Array.isArray(tech_stack) ? tech_stack : [],
      user_id: userId.trim(),
    });

    const supabase = createServerClient();
    if (supabase && isUuid(newProject.user_id)) {
      try {
        const basePayload: any = {
          user_id: newProject.user_id,
          name: newProject.name,
          track: newProject.track,
          description: newProject.description,
          tech_stack: newProject.tech_stack,
          status: newProject.status,
          message_count: 0,
          sources_count: 0,
          created_at: newProject.created_at,
          updated_at: newProject.updated_at,
        };

        let { data, error } = await supabase
          .from("projects")
          .insert([{ ...basePayload, summary: newProject.summary }])
          .select()
          .single();

        if (error) {
          // Retry without summary column in case remote schema doesn't have summary column
          const retry = await supabase.from("projects").insert([basePayload]).select().single();
          if (retry.data) {
            data = retry.data;
            error = null;
          }
        }

        if (error) {
          console.warn("[HackForge Projects API] Supabase insert warning:", error.message);
        } else if (data) {
          newProject.id = data.id;
          mockDb.projects.set(data.id, newProject);
        }
      } catch (err) {
        console.warn("[HackForge Projects API] Supabase insert failed, created in mockDb:", err);
      }
    }

    mockDb.projects.set(newProject.id, newProject);

    return NextResponse.json({
      success: true,
      project: newProject,
    });
  } catch (err: any) {
    console.error("[HackForge Projects API] Create error:", err);
    return NextResponse.json({ error: err?.message || "Failed to create project" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const authUser = await getAuthenticatedUser(req);
    const userId = authUser?.id || searchParams.get("userId") || undefined;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "Authentication required to delete a project" }, { status: 401 });
    }

    mockDb.deleteProject(projectId);

    const supabase = createServerClient();
    if (supabase && isUuid(projectId)) {
      try {
        await supabase
          .from("projects")
          .delete()
          .eq("id", projectId)
          .eq("user_id", userId);
      } catch (err) {
        console.warn("[HackForge Projects API] Supabase delete error:", err);
      }
    }

    return NextResponse.json({ success: true, message: "Project deleted successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to delete project" }, { status: 500 });
  }
}
