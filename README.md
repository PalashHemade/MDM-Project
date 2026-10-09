# Einstieg

AI-powered HR interview simulator for international candidates applying for jobs in Germany. See [PLANNING.md](PLANNING.md) for the full architecture, schema, and phased roadmap — this file is just how to get it running and how to use what's built so far.

## Stack

Next.js (App Router, TypeScript, Tailwind) · Prisma 7 + PostgreSQL (Supabase) · custom JWT auth · Gemini 3.1 Flash-Lite · self-hosted Whisper (planned, not wired up yet)

## 1. Prerequisites

- Node.js 22+
- A [Supabase](https://supabase.com) project (free tier is fine) for Postgres
- A [Google AI Studio](https://aistudio.google.com) API key (free tier) for Gemini — optional for now; without it the interview engine still runs, just without adaptive follow-ups (see "Known limitation" below)

## 2. Install

```bash
npm install
```

## 3. Configure environment

Copy the template and fill in real values:

```bash
cp .env.example .env
```

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase project → Connect → pooled connection string (port 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | Same place → direct connection string (port 5432, no pooler) — required for migrations |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API (not yet used by any code — reserved for file storage in a later phase) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Any strong random string, e.g. `openssl rand -base64 48` — generate two different values |
| `GOOGLE_AI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey), free tier |

## 4. Set up the database

```bash
npx prisma migrate dev   # creates all tables
npx prisma generate      # regenerates the typed client (migrate dev usually triggers this too)
npx prisma db seed       # loads the 100-question HR interview bank
```

## 5. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How to use it

1. **Sign up** at `/signup` (or the landing page). The app is in simplified German by default once you're inside it — click the **DE/EN** pill top-right to switch.
2. **Fill in your profile** at `/profile` — target location, target company type, German/English level, career goals. The dashboard shows how complete it is.
3. **Start a practice interview** from the sidebar (**KI-Interview**) or `/interview/setup`: pick interview language, difficulty, and type, then start.
4. **Answer in the text box.** Each answer is sent to the interview engine, which either asks a follow-up about something specific you just said, or moves to a new question from the bank — it tracks which HR topics (motivation, teamwork, conflict, strengths/weaknesses, etc.) have been covered and won't end the session until the core ones are hit.
5. The session ends after enough turns and category coverage; a completion screen appears. Scoring/feedback isn't built yet (that's Phase 5+).

### Known limitation right now

Without a real `GOOGLE_AI_API_KEY`, the interview engine can't call Gemini, so it silently falls back to always picking the next question from the bank — no claim extraction, no contextual follow-ups. The conversation still works end-to-end, it just won't feel adaptive until a real key is set.

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (also type-checks) |
| `npm run lint` | ESLint |
| `npx prisma studio` | Browse the database in a GUI |
| `npx prisma migrate dev --name <description>` | Create + apply a migration after changing `prisma/schema.prisma` |
| `npx prisma db seed` | Re-run the question bank seed (safe to re-run, upserts by code) |

## Project structure

```
prisma/schema.prisma       # data model (see PLANNING.md §4)
prisma/seed.ts              # the 100-question HR interview bank
src/app/                    # pages + API routes (App Router)
src/app/(protected)/        # auth-gated pages: dashboard, profile, interview
src/app/api/                # route handlers (auth, profile, interviews)
src/lib/auth/               # JWT issuing/rotation, password hashing, session helper
src/lib/i18n/                # DE/EN dictionaries + ui_lang cookie
src/lib/interview/           # the adaptive interview engine (engine.ts, orchestrator.ts)
src/lib/llm/gemini.ts        # thin Gemini API wrapper
src/components/              # UI components
```

## Where things stand

Phases 1–3 (foundation, question bank, text-based adaptive interview) are built. Voice, language/speech scoring, CV tooling, company knowledge/RAG, and the full evaluation report are not — see PLANNING.md section 11 for the full phase plan.
