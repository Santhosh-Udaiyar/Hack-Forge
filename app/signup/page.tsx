"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, User, ArrowRight, CheckCircle2, AlertCircle, Sparkles, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { Logo } from "@/components/ui/Logo";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

function SignUpFormContent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signUp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setErrorMsg(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  // Password requirements calculation
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Please enter your name");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address");
      return;
    }
    if (!hasMinLength) {
      setErrorMsg("Password must be at least 8 characters long");
      return;
    }

    setIsSubmitting(true);
    const result = await signUp(email.trim(), password, name.trim());
    setIsSubmitting(false);

    if (result.error) {
      setErrorMsg(result.error);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 relative overflow-hidden bg-[#07080d]">
      {/* Ambient background glow */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-purple-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md rounded-3xl border border-white/[0.08] bg-[#0c1022]/80 backdrop-blur-2xl p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Logo size={64} className="mb-2" />
          <h1 className="font-heading text-2xl font-black tracking-tight text-white">
            Create your HackForge account
          </h1>
          <p className="text-xs text-slate-400 max-w-xs">
            Join the RAG-grounded hackathon mentor, pitch coach & AI judging platform.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300 flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google OAuth Button */}
        <div className="space-y-4">
          <GoogleSignInButton
            text="Continue with Google"
            onError={(err) => setErrorMsg(err)}
          />

          {/* Horizontal Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-white/[0.08]" />
            <span className="bg-[#0c1022] px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              or
            </span>
            <div className="w-full border-t border-white/[0.08]" />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full rounded-xl border border-white/[0.1] bg-[#080b18]/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@hackathon.org"
                className="w-full rounded-xl border border-white/[0.1] bg-[#080b18]/80 pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-white/[0.1] bg-[#080b18]/80 pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password Strength Hints */}
            {password.length > 0 && (
              <div className="mt-2 space-y-1 text-[10px] text-slate-400 pl-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className={`h-3 w-3 ${hasMinLength ? "text-emerald-400" : "text-slate-600"}`} />
                  <span className={hasMinLength ? "text-slate-200" : "text-slate-400"}>At least 8 characters</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className={`h-3 w-3 ${hasUpper ? "text-emerald-400" : "text-slate-600"}`} />
                  <span className={hasUpper ? "text-slate-200" : "text-slate-400"}>Uppercase letter</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className={`h-3 w-3 ${hasNumber ? "text-emerald-400" : "text-slate-600"}`} />
                  <span className={hasNumber ? "text-slate-200" : "text-slate-400"}>Number or symbol</span>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Creating account...</span>
            ) : (
              <>
                <span>Create account with Email</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="text-center pt-2 border-t border-white/[0.08] text-xs text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-purple-400 hover:text-purple-300 hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#07080d]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
        </div>
      }
    >
      <SignUpFormContent />
    </Suspense>
  );
}
