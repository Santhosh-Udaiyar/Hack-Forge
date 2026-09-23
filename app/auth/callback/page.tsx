"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";
import { Sparkles, AlertCircle } from "lucide-react";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusText, setStatusText] = useState("Authenticating with Google...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function processOAuthCallback() {
      // 1. Check for errors returned directly by Google/Supabase OAuth
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");
      if (error || errorDescription) {
        const errorMsg = errorDescription || error || "Google sign-in was cancelled or failed.";
        router.replace(`/login?error=${encodeURIComponent(errorMsg)}`);
        return;
      }

      // 2. Extract authorization code
      const code = searchParams.get("code");
      const next = searchParams.get("next") || "/dashboard";

      if (isSupabaseConfigured) {
        const supabase = createClient();
        if (!supabase) {
          router.replace(`/login?error=${encodeURIComponent("Supabase client unavailable")}`);
          return;
        }

        try {
          if (code) {
            setStatusText("Exchanging authorization code...");
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              console.error("[Auth Callback] Exchange error:", exchangeError);
              router.replace(`/login?error=${encodeURIComponent(exchangeError.message)}`);
              return;
            }
          }

          // Verify session exists
          setStatusText("Finalizing your session...");
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError || !session) {
            // Check if user is retrieved
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
              router.replace(`/login?error=${encodeURIComponent("Failed to establish authenticated session.")}`);
              return;
            }
          }

          // Success - Redirect straight to Dashboard
          router.replace(next);
        } catch (err: any) {
          console.error("[Auth Callback] Unexpected error:", err);
          router.replace(`/login?error=${encodeURIComponent(err?.message || "Authentication failed.")}`);
        }
      } else {
        // Mock fallback mode: immediately redirect to dashboard
        setTimeout(() => {
          router.replace(next);
        }, 300);
      }
    }

    processOAuthCallback();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden bg-[#07080d]">
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-purple-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0c1022]/90 backdrop-blur-2xl p-8 shadow-2xl text-center space-y-6">
        <div className="flex flex-col items-center gap-3">
          <Logo size={56} className="animate-bounce" />
          <h2 className="font-heading text-lg font-black text-white tracking-tight">
            Signing you in
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            {statusText}
          </p>
        </div>

        {errorMessage ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300 flex items-center gap-2 text-left">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        ) : (
          <div className="flex justify-center items-center py-2">
            <div className="relative flex items-center justify-center">
              <div className="h-10 w-10 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
              <Sparkles className="absolute h-4 w-4 text-purple-400 animate-pulse" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#07080d]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
