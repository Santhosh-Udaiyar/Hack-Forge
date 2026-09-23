import { NextRequest, NextResponse } from "next/server";
import { updateProjectMemory } from "@/lib/memory/summarizer";
import { mockDb } from "@/lib/supabase/mock-db";
import { createServerClient, isUuid } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth/server-auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const authUser = await getAuthenticatedUser(req);
  const userId = authUser?.id || searchParams.get("userId") || undefined;

  if (!projectId) {
    return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
  }

  let memory = mockDb.projectMemories.get(projectId);
  const supabase = createServerClient();
  if (supabase && isUuid(projectId)) {
    let query = supabase.from("project_memory").select("*").eq("project_id", projectId);
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { data } = await query.maybeSingle();
    if (data) memory = data;
  }

  return NextResponse.json({ memory: memory || null });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, messages = [] } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const authUser = await getAuthenticatedUser(req);
    const userId = authUser?.id || body.userId || undefined;

    if (!userId) {
      return NextResponse.json({ error: "Authentication required to update project memory" }, { status: 401 });
    }

    let existingMemory = mockDb.projectMemories.get(projectId);
    const supabase = createServerClient();
    if (supabase && isUuid(projectId)) {
      let query = supabase.from("project_memory").select("*").eq("project_id", projectId);
      if (userId) {
        query = query.eq("user_id", userId);
      }
      const { data } = await query.maybeSingle();
      if (data) existingMemory = data;
    }

    const updated = await updateProjectMemory({
      projectId,
      userId,
      existingMemory,
      newMessages: messages,
    });

    return NextResponse.json({ success: true, memory: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to update memory" }, { status: 500 });
  }
}

