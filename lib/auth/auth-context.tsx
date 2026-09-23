"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { UserProfile } from "@/types";

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password?: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signUp: (email: string, password?: string, name?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = "hackforge_auth_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const extractUserProfile = (supabaseUser: any): UserProfile => {
    const meta = supabaseUser.user_metadata || {};
    const name =
      meta.full_name ||
      meta.name ||
      meta.user_name ||
      supabaseUser.email?.split("@")[0] ||
      "Hacker";
    const avatar_url = meta.avatar_url || meta.picture || undefined;

    return {
      id: supabaseUser.id,
      email: supabaseUser.email || "",
      name,
      avatar_url,
      created_at: supabaseUser.created_at,
    };
  };

  useEffect(() => {
    let authSubscription: { unsubscribe: () => void } | null = null;

    async function initAuth() {
      if (isSupabaseConfigured) {
        const supabase = createClient();
        if (supabase) {
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData?.session?.user) {
              setUser(extractUserProfile(sessionData.session.user));
            } else {
              const { data: userData } = await supabase.auth.getUser();
              if (userData?.user) {
                setUser(extractUserProfile(userData.user));
              }
            }

            // Listen to auth state changes across all tabs/redirects
            const { data } = supabase.auth.onAuthStateChange((_event, session) => {
              if (session?.user) {
                setUser(extractUserProfile(session.user));
              } else {
                setUser(null);
              }
              setIsLoading(false);
            });
            authSubscription = data.subscription;
          } catch (e) {
            console.warn("Supabase initAuth error:", e);
          }
        }
      } else {
        // Fallback local session store for offline usage
        try {
          const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
          if (stored) {
            setUser(JSON.parse(stored));
          } else {
            setUser(null);
          }
        } catch (e) {
          console.warn("Local storage auth read failed:", e);
          setUser(null);
        }
      }
      setIsLoading(false);
    }

    initAuth();

    return () => {
      authSubscription?.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (): Promise<{ error?: string }> => {
    if (isSupabaseConfigured) {
      const supabase = createClient();
      if (!supabase) {
        return { error: "Supabase client not initialized" };
      }

      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : "/auth/callback";

      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo,
            queryParams: {
              access_type: "offline",
              prompt: "consent",
            },
          },
        });

        if (error) {
          return { error: error.message };
        }

        if (data?.url && typeof window !== "undefined") {
          window.location.assign(data.url);
        }
        return {};
      } catch (err: any) {
        return { error: err?.message || "Failed to initiate Google OAuth" };
      }
    }

    // Local Mock Auth Google SignIn fallback
    const googleMockUser: UserProfile = {
      id: `usr-google-${Date.now()}`,
      email: "alex.rivera.dev@gmail.com",
      name: "Alex Rivera",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&h=128&fit=crop&crop=faces",
      created_at: new Date().toISOString(),
    };
    setUser(googleMockUser);
    try {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(googleMockUser));
    } catch {}
    return {};
  };

  const signUp = async (email: string, password = "", name = ""): Promise<{ error?: string }> => {
    setIsLoading(true);
    if (isSupabaseConfigured) {
      const supabase = createClient();
      if (!supabase) return { error: "Supabase client not initialized" };

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      setIsLoading(false);
      if (error) return { error: error.message };

      if (data?.user) {
        setUser(extractUserProfile(data.user));
      }
      return {};
    }

    // Local Mock Auth SignUp
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email,
      name: name || email.split("@")[0],
      created_at: new Date().toISOString(),
    };
    setUser(newUser);
    try {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(newUser));
    } catch {}
    setIsLoading(false);
    return {};
  };

  const signIn = async (email: string, password = ""): Promise<{ error?: string }> => {
    setIsLoading(true);
    if (isSupabaseConfigured) {
      const supabase = createClient();
      if (!supabase) return { error: "Supabase client not initialized" };

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      setIsLoading(false);
      if (error) return { error: error.message };

      if (data?.user) {
        setUser(extractUserProfile(data.user));
      }
      return {};
    }

    // Local Mock Auth SignIn
    const loggedInUser: UserProfile = {
      id: `usr-${email.replace(/[^a-zA-Z0-9]/g, "") || "demo"}`,
      email,
      name: email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1),
      created_at: new Date().toISOString(),
    };
    setUser(loggedInUser);
    try {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(loggedInUser));
    } catch {}
    setIsLoading(false);
    return {};
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      const supabase = createClient();
      if (supabase) await supabase.auth.signOut();
    }
    setUser(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    } catch {}
  };

  const resetPassword = async (email: string): Promise<{ error?: string; message?: string }> => {
    if (isSupabaseConfigured) {
      const supabase = createClient();
      if (supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) return { error: error.message };
        return { message: "Password reset link sent to your email." };
      }
    }
    return { message: "Password reset instructions sent to " + email };
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signInWithGoogle, signUp, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
