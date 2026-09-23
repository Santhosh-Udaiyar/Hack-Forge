import { NextRequest, NextResponse } from "next/server";
import { runSelfConsistentJudge } from "@/lib/judge/evaluator";
import { mockDb } from "@/lib/supabase/mock-db";
import { createServerClient, isUuid } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth/server-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, pitchNotes = "" } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // 1. Authenticate User
    const authUser = await getAuthenticatedUser(req);
    const userId = authUser?.id || body.userId || undefined;

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required to run AI judging" },
        { status: 401 }
      );
    }

    // 2. Fetch Project & Memory with User Ownership Validation
    let project = mockDb.getProject(projectId, userId);
    let memory = mockDb.projectMemories.get(projectId);

    const supabase = createServerClient();
    if (supabase && isUuid(projectId)) {
      let projQuery = supabase.from("projects").select("*").eq("id", projectId);
      if (userId) {
        projQuery = projQuery.eq("user_id", userId);
      }
      const { data: projData } = await projQuery.maybeSingle();
      if (projData) project = projData;

      let memQuery = supabase.from("project_memory").select("*").eq("project_id", projectId);
      if (userId) {
        memQuery = memQuery.eq("user_id", userId);
      }
      const { data: memData } = await memQuery.maybeSingle();
      if (memData) memory = memData;
    }

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or you do not have permission to evaluate it" },
        { status: 404 }
      );
    }

    // 3. Run Dual-Run Self-Consistency Evaluation
    const verdict = await runSelfConsistentJudge({
      projectId,
      userId,
      project,
      memory,
      submissionPitchText: pitchNotes,
    });

    return NextResponse.json({
      success: true,
      verdict,
    });
  } catch (err: any) {
    console.error("[HackForge Judge API] Error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to execute AI Judge evaluation." },
      { status: 500 }
    );
  }
}

