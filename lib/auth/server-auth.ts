import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export interface AuthenticatedUser {
  id: string;
  email?: string;
  isVerified: boolean;
}

/**
 * Server-side helper to extract and verify the authenticated user ID
 * Checks Authorization header Bearer token, Supabase session cookies, and fallback headers
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  const supabase = createServerClient();

  // 1. Check Bearer Token with Supabase Auth
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();
    if (supabase && token) {
      try {
        const { data, error } = await supabase.auth.getUser(token);
        if (data?.user && !error) {
          return {
            id: data.user.id,
            email: data.user.email,
            isVerified: true,
          };
        }
      } catch (err) {
        console.warn("[Server Auth] Token verification error:", err);
      }
    }
  }

  // 2. Check x-user-id header
  const headerUserId = req.headers.get("x-user-id");
  if (headerUserId && typeof headerUserId === "string" && headerUserId.trim()) {
    return {
      id: headerUserId.trim(),
      isVerified: false,
    };
  }

  // 3. Fallback to searchParams or body user_id if provided
  const { searchParams } = new URL(req.url);
  const paramUserId = searchParams.get("userId") || searchParams.get("user_id");
  if (paramUserId && typeof paramUserId === "string" && paramUserId.trim()) {
    return {
      id: paramUserId.trim(),
      isVerified: false,
    };
  }

  return null;
}
