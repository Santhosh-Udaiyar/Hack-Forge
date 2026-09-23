"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/client";

interface GoogleSignInButtonProps {
  text?: string;
  onError?: (err: string) => void;
  className?: string;
  disabled?: boolean;
}

export const GoogleIcon: React.FC<{ className?: string }> = ({ className = "h-4 w-4 shrink-0" }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.34 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  text = "Continue with Google",
  onError,
  className = "",
  disabled = false,
}) => {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear loading state when user refocuses or switches back to tab
  useEffect(() => {
    const handleReset = () => {
      setIsLoading(false);
    };

    window.addEventListener("focus", handleReset);
    window.addEventListener("pageshow", handleReset);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        setIsLoading(false);
      }
    });

    return () => {
      window.removeEventListener("focus", handleReset);
      window.removeEventListener("pageshow", handleReset);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClick = async () => {
    if (isLoading || disabled) return;
    setIsLoading(true);

    // Set safety timeout to prevent permanent button lock
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 6000);

    try {
      const res = await signInWithGoogle();
      if (res?.error) {
        setIsLoading(false);
        onError?.(res.error);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      } else {
        // If in mock mode (Supabase not configured), route immediately
        if (!isSupabaseConfigured) {
          setIsLoading(false);
          router.push("/dashboard");
        }
      }
    } catch (err: any) {
      setIsLoading(false);
      onError?.(err?.message || "Google sign-in failed. Please try again.");
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading || disabled}
      aria-label={text}
      className={`w-full flex items-center justify-center gap-3 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-[#3c4043] border border-[#dadce0] shadow-sm hover:bg-[#f8f9fa] hover:border-[#d2e3fc] hover:shadow transition-all duration-200 active:bg-[#f1f3f4] disabled:opacity-75 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
          <span className="text-[#3c4043]">Connecting to Google...</span>
        </div>
      ) : (
        <>
          <GoogleIcon className="h-4 w-4" />
          <span>{text}</span>
        </>
      )}
    </button>
  );
};
