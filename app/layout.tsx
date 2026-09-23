import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";

export const metadata: Metadata = {
  title: "HackForge — AI Hackathon Mentor & Judge Platform",
  description: "End-to-end RAG-grounded mentor, dual-run self-consistent AI Judge, Gemini Live voice pitch practice, and multi-day project memory for hackathons.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#07080d] text-slate-100 antialiased selection:bg-purple-500 selection:text-white">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(124,92,255,0.14),rgba(79,216,224,0.06),rgba(0,0,0,0))] pointer-events-none z-0" />
        <div className="relative z-10 flex min-h-screen flex-col">
          <AuthProvider>
            {children}
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
