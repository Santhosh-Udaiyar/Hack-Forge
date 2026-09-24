<div align="center">

# 🔨 HackForge

### Stop guessing what the judges want. Ask the docs.

**An AI mentor for hackathon teams — grounded chat, rubric-based judging, and voice pitch practice, all cited back to your actual event rules.**

![Next.js](https://img.shields.io/badge/Next.js-000?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-8E75B2?logo=googlegemini&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue)
![Status](https://img.shields.io/badge/status-early%20build-orange)

[Features](#-features) • [How it works](#-how-it-works) • [Getting started](#-getting-started) • [Roadmap](#-roadmap)

</div>

---

## 📖 Overview

Most hackathon teams lose hours re-reading rules PDFs, second-guessing 
whether their idea is even eligible, and getting generic feedback that 
doesn't reference their actual project or event.

**HackForge fixes that.** Upload your event's rules and your own project 
docs, and every AI response — mentor advice, rubric scores, pitch 
feedback — is grounded in those specific sources, with a citation back 
to the exact page it came from. No hallucinated rules. No generic advice. 
Just answers you can verify.

## ✨ Features

| | |
|---|---|
| 💬 **Grounded Mentor Chat** | Ask about your project or the event rules — every answer cites the exact document and chunk it came from, click-through to the source |
| ⚖️ **AI Judge** | Scores your submission against a rubric (feasibility, originality, technical depth), with reasoning and citations, so you catch weak spots before the real judges do |
| 🎙️ **Voice Mentor** | Practice your pitch out loud via real-time voice and get spoken feedback on clarity, structure, and timing |
| 🔒 **Isolated Projects** | Every project has its own documents, conversation history, and judge results — enforced at the database level with Row Level Security, not just the UI |
| 📎 **Source Citations** | Click any citation badge in a response to jump straight to the highlighted source chunk |
| 🔑 **Auth** | Email/password or Google sign-in via Supabase Auth |

## 🧠 How it works

```
   Upload docs                    Ask a question
        │                               │
        ▼                               ▼
  Extract + chunk                Embed question
        │                        (gemini-embedding-2)
        ▼                               │
  Embed chunks                          ▼
  (gemini-embedding-2)         Vector search
        │                      (pgvector + HNSW,
        ▼                       cosine similarity)
  Store in Supabase                     │
  pgvector, scoped to           ◄───────┘
  project_id                    Top-K relevant chunks
                                         │
                                         ▼
                              Similarity threshold check
                                    │         │
                               relevant   not relevant
                                    │         │
                                    ▼         ▼
                            Gemini answers   "Information
                            with grounded     not found"
                            context, cites
                            source chunks
                                    │
                                    ▼
                           Response + citations
                           rendered in chat
```

Every mode — Mentor, Judge, Voice — runs through this same grounded 
retrieval pipeline underneath; what changes between modes is the system 
prompt and temperature, not the retrieval logic.

## 🛠️ Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth + Row Level Security |
| Vector store | PostgreSQL + pgvector |
| Vector index | HNSW |
| Similarity search | Cosine similarity |
| Embeddings | `gemini-embedding-2` |
| Chunking | LangChain RecursiveCharacterTextSplitter |
| LLM | Gemini |
| Voice | Gemini Live API |
| Charts | Recharts |

## 🚀 Getting started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project (with the `pgvector` extension enabled)
- A [Gemini API key](https://ai.google.dev)

### Setup

```bash
# Clone the repo
git clone https://github.com/Santhosh-Udaiyar/Hack-Forge.git
cd Hack-Forge

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# then fill in your Supabase + Gemini keys, see below

# Run database migrations
npx supabase db push

# Start the dev server
npm run dev
```

Visit `http://localhost:3000` to see it running.

### Environment variables

Create `.env.local` with:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

> ⚠️ Never commit `.env.local` — it's already covered by `.gitignore`.

## 📁 Project structure

```
hackforge/
├── app/
│   ├── (auth)/            # login, signup
│   ├── dashboard/         # project list
│   ├── project/[id]/      # chat, judge, voice per project
│   └── api/                # ingest, chat, judge endpoints
├── components/              # chat, judge, and shared UI
├── lib/
│   ├── supabase/            # client + server helpers
│   ├── gemini/               # embedding + generation calls
│   └── chunking.ts
└── supabase/
    └── migrations/          # schema + RLS policies
```

## 🗺️ Roadmap

- [x] Auth (email + Google)
- [x] Isolated project workspaces with Row Level Security
- [x] Document ingestion pipeline (extract → chunk → embed)
- [x] Grounded mentor chat with click-through citations
- [ ] AI Judge rubric scoring
- [ ] Voice mentor (Gemini Live integration)
- [ ] Polished dashboard with project status tracking

## ❓ FAQ

**Does this replace human judges?**
No — it's designed as prep and self-assessment for teams, not a 
replacement for real event judging.

**What happens if my question isn't covered by the uploaded docs?**
HackForge responds with "information not found" rather than guessing — 
grounding is enforced by a similarity threshold, not just prompted for.

**Can multiple people use the same project?**
Not yet — each project is currently scoped to a single account. Team 
workspaces are a possible future addition.

## 🤝 Contributing

This started as a solo portfolio project, but issues and suggestions 
are welcome. If you'd like to contribute, please open an issue first 
to discuss the change before submitting a PR.

## 📄 License

Licensed under the [MIT License](LICENSE).

---

<div align="center">

Built by [Santhosh Udaiyar](https://github.com/Santhosh-Udaiyar) and [Yazhini SP](https://github.com/yazhini-stack)

</div>
