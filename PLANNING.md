# Germany Job Interview & Career Readiness Platform — Technical Plan

Status: pre-implementation, locked stack, schema/architecture not yet built.

## 1. What this document is

This is the implementation plan referenced throughout our planning conversation: database schema, interview state machine, RAG architecture, prompt architecture, speech pipeline, evaluation rubric, auth design, and phased milestones. Nothing in here is final — each phase is expected to get refined as we build it — but this is the shared reference point before writing code.

## 2. Locked tech stack

```
Frontend/Backend : Next.js + TypeScript + Tailwind (single app, API routes/server actions)
ORM              : Prisma
Database         : PostgreSQL + pgvector, via Supabase
Auth             : Custom JWT (access 15min / refresh 7day, httpOnly cookies, rotation + revocation)
                   — Supabase used for DB/storage only, not its Auth product
Storage          : Supabase Storage (CVs, audio recordings)
LLM              : Gemini 3.1 Flash-Lite (free tier, Google AI Studio)
                   — move off free tier before any real candidate data flows through it
                     (free tier ToS allows use for Google product improvement; paid/Vertex does not)
Speech-to-text   : Self-hosted Whisper (open-source), hosted separately from the Next.js app
Hosting          : Vercel (app) + Supabase (DB/storage)
```

## 3. Product scope locked for V1

- HR interview only, not technical interviews.
- Two independent profile axes, not one journey picker:
  - `targetLocation`: GERMANY | ABROAD | OPEN
  - `targetCompanyType`: GERMAN_COMPANY | INTERNATIONAL | OPEN
- Market intelligence: curated/editorial content only. No live job-market scraping in V1.
- Lebenslauf: AI-assisted co-drafting (section-level suggestions, not just critique).
- No training on candidate interview data, ever. If cross-candidate insight is wanted later, it's computed as anonymized aggregate statistics over outcomes, injected into RAG context like any other knowledge source — never raw transcripts, never model fine-tuning.
- Speech evaluation uses "speech delivery indicators" framing, never a bare "confidence score."
- Company-specific claims must always carry a source + verification date. No "Company X always asks Y" language anywhere in generated output.

## 4. Database schema (Prisma)

Representative schema — field lists are illustrative, not exhaustive. Enums abbreviated.

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  profile       CandidateProfile?
  refreshTokens RefreshToken[]
}

model RefreshToken {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  tokenHash       String
  expiresAt       DateTime
  revokedAt       DateTime?
  replacedById    String?
  createdAt       DateTime  @default(now())
}

model CandidateProfile {
  id                     String   @id @default(cuid())
  userId                 String   @unique
  user                   User     @relation(fields: [userId], references: [id])
  name                   String
  currentCountry         String
  degree                 String?
  university             String?
  germanLevel            CEFRLevel?   // NONE, A1..C2
  englishLevel           CEFRLevel?
  targetLocation         TargetLocation      // GERMANY, ABROAD, OPEN
  targetCompanyType      TargetCompanyType   // GERMAN_COMPANY, INTERNATIONAL, OPEN
  preferredCities        String[]
  workAuthorizationStatus String?
  careerGoals            String?
  hobbies                String[]
  interests              String[]
  experiences            Experience[]
  projects               ProjectEntry[]
  skills                 SkillEntry[]
  cvs                    CV[]
  coverLetters           CoverLetter[]
  interviews             Interview[]
  practiceSessions       PracticeSession[]
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
}

model Experience {
  id            String   @id @default(cuid())
  profileId     String
  profile       CandidateProfile @relation(fields: [profileId], references: [id])
  company       String
  role          String
  startDate     DateTime
  endDate       DateTime?
  description   String
  isInternship  Boolean  @default(false)
}

model ProjectEntry {
  id            String   @id @default(cuid())
  profileId     String
  profile       CandidateProfile @relation(fields: [profileId], references: [id])
  title         String
  description   String
  technologies  String[]
  role          String?
}

model SkillEntry {
  id            String   @id @default(cuid())
  profileId     String
  profile       CandidateProfile @relation(fields: [profileId], references: [id])
  name          String
  category      String?
  proficiency   String?
}

model CV {
  id              String   @id @default(cuid())
  profileId       String
  profile         CandidateProfile @relation(fields: [profileId], references: [id])
  rawUploadUrl    String?
  structuredData  Json
  aiSuggestions   Json?
  status          CVStatus  // DRAFT, AI_REVIEWED, FINALIZED
  version         Int      @default(1)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model CoverLetter {
  id          String   @id @default(cuid())
  profileId   String
  profile     CandidateProfile @relation(fields: [profileId], references: [id])
  content     String
  jobId       String?
  createdAt   DateTime @default(now())
}

model Company {
  id                 String   @id @default(cuid())
  name               String   @unique
  slug               String   @unique
  overview           String
  germanyLocations   String[]
  industries         String[]
  values             String[]
  hiringProcessNotes String?
  languageInfo       String?
  lastVerifiedAt     DateTime?
  knowledgeSources    KnowledgeSource[]
  jobPostings         JobPosting[]
  interviews          Interview[]
}

model KnowledgeSource {
  id           String   @id @default(cuid())
  companyId    String?
  company      Company? @relation(fields: [companyId], references: [id])
  title        String
  url          String?
  sourceType   SourceType // OFFICIAL, CANDIDATE_REPORTED, EDITORIAL
  content      String
  retrievedAt  DateTime
  // embedding vector(768) column added via raw SQL migration, queried via $queryRaw
}

model JobPosting {
  id                   String   @id @default(cuid())
  profileId            String?
  companyId            String?
  company              Company? @relation(fields: [companyId], references: [id])
  companyNameRaw       String?
  title                String
  location             String?
  rawDescription       String
  responsibilities     String[]
  requiredSkills       String[]
  preferredSkills      String[]
  educationReq         String?
  experienceReq        String?
  germanRequirement    LanguageRequirement  // EXPLICIT, PREFERRED, NOT_EXPLICIT, UNCLEAR
  englishRequirement   LanguageRequirement
  otherLanguageReq     String?
  visaInfoExtracted    String?
  potentialTopics      String[]
  createdAt            DateTime @default(now())
  interviews           Interview[]
}

model InterviewQuestionBank {
  id                String   @id @default(cuid())
  textDe            String
  textEn            String
  category          QuestionCategory
  difficulty        Difficulty
  cefrRelevance     String?
  followUpTopics    String[]
  companyRelevance  String[]
  roleRelevance     String[]
  expectedCompetency String?
}

model Interview {
  id            String   @id @default(cuid())
  profileId     String
  profile       CandidateProfile @relation(fields: [profileId], references: [id])
  jobPostingId  String?
  jobPosting    JobPosting? @relation(fields: [jobPostingId], references: [id])
  companyId     String?
  company       Company? @relation(fields: [companyId], references: [id])
  language      InterviewLanguage // DE, EN
  difficulty    Difficulty
  type          InterviewType     // GENERAL, GERMANY_FOCUSED, COMPANY_FOCUSED, JOB_FOCUSED
  status        InterviewStatus   // SETUP, IN_PROGRESS, COMPLETE
  startedAt     DateTime?
  completedAt   DateTime?
  turns         InterviewTurn[]
  claims        InterviewClaim[]
  languageAssessment      LanguageAssessment?
  performanceAssessment   InterviewPerformanceAssessment?
  culturalAssessment      CulturalCommunicationAssessment?
  feedback      InterviewFeedback?
}

model InterviewTurn {
  id                  String   @id @default(cuid())
  interviewId         String
  interview           Interview @relation(fields: [interviewId], references: [id])
  sequence            Int
  questionText        String
  questionSource      QuestionSource // BANK, GENERATED_FOLLOWUP
  parentTurnId        String?        // the turn this follows up on, if any
  audioUrl            String?
  transcript          String?
  transcriptWordTimestamps Json?
  answeredAt          DateTime?
  speechMetric        SpeechMetric?
}

model InterviewClaim {
  id                   String   @id @default(cuid())
  interviewId          String
  interview            Interview @relation(fields: [interviewId], references: [id])
  turnId               String
  topic                String
  claimText            String
  firstMentionedTurnId String
  revisitedTurnIds     String[]
}

model SpeechMetric {
  id                    String   @id @default(cuid())
  turnId                String   @unique
  turn                  InterviewTurn @relation(fields: [turnId], references: [id])
  durationSec           Float
  speakingDurationSec   Float
  wordsPerMinute        Float
  pauseCount            Int
  longPauseCount        Int
  fillerWordCount       Int
  fillerWords           String[]
}

model LanguageAssessment {
  id                    String @id @default(cuid())
  interviewId           String @unique
  interview             Interview @relation(fields: [interviewId], references: [id])
  grammarScore          Int
  vocabularyScore       Int
  fluencyScore          Int
  comprehensionScore    Int
  professionalLangScore Int
  explanation           String
}

model InterviewPerformanceAssessment {
  id                  String @id @default(cuid())
  interviewId         String @unique
  interview           Interview @relation(fields: [interviewId], references: [id])
  relevanceScore      Int
  structureScore      Int
  motivationScore     Int
  professionalismScore Int
  followUpHandlingScore Int
  explanation         String
}

model CulturalCommunicationAssessment {
  id                  String @id @default(cuid())
  interviewId         String @unique
  interview           Interview @relation(fields: [interviewId], references: [id])
  formalityScore      Int
  sieDuNotes          String?
  clarityScore        Int
  culturalAwarenessScore Int
  explanation         String
}

model InterviewFeedback {
  id               String @id @default(cuid())
  interviewId      String @unique
  interview        Interview @relation(fields: [interviewId], references: [id])
  overallReadiness Int
  mainStrength     String
  mainWeakness     String
  recommendations  String[]
  createdAt        DateTime @default(now())
}

model PracticeSession {
  id                String   @id @default(cuid())
  profileId         String
  profile           CandidateProfile @relation(fields: [profileId], references: [id])
  basedOnInterviewId String?
  focusArea         String
  items             Json
  completedAt       DateTime?
  createdAt         DateTime @default(now())
}

model EditorialContent {
  id             String   @id @default(cuid())
  title          String
  slug           String   @unique
  category       String
  body           String
  publishedAt    DateTime
  lastReviewedAt DateTime
}
```

Enums not spelled out above (`CEFRLevel`, `TargetLocation`, `TargetCompanyType`, `CVStatus`, `SourceType`, `LanguageRequirement`, `QuestionCategory`, `Difficulty`, `InterviewLanguage`, `InterviewType`, `InterviewStatus`, `QuestionSource`) get defined when we actually write `schema.prisma`.

The `vector` column on `KnowledgeSource` isn't expressible in Prisma's schema language — it's added via a raw SQL migration (`ALTER TABLE ... ADD COLUMN embedding vector(768)`) and queried with `$queryRaw` for similarity search, while every other field on that model goes through normal Prisma queries.

## 5. Interview state machine

States:

```
SETUP            — candidate picks company/role/job description/language/difficulty/type
READY            — configuration complete, interview not yet started
QUESTION_PENDING — engine has decided the next question, not yet shown to candidate
AWAITING_ANSWER  — question shown/spoken, waiting on candidate's recorded answer
TRANSCRIBING     — audio sent to Whisper, waiting on transcript
ANALYZING        — claim extraction + follow-up decision running
COMPLETE         — turn budget and category coverage satisfied
EVALUATING       — post-interview scoring running
REPORT_READY     — feedback available to candidate
```

Per-turn decision logic (runs in the `ANALYZING` state):

1. Extract claims from the transcript via LLM call — structured output: `{ topic, claimText, isVague }[]`.
2. If any claim is flagged vague (e.g. "I was very motivated" with no concrete reason) **and** the follow-up budget for that topic hasn't been used up, generate a contextual follow-up question referencing the specific claim.
3. Otherwise, pull the next question from the bank, filtered by: category not yet covered in this interview, relevance to job/company/role, matching difficulty.
4. Update claim memory: new claims get appended; if a claim's topic matches an earlier claim, link it as a "revisit" rather than a duplicate.
5. Stop condition: a target turn count (8–12, matching the MVP definition) **and** minimum category coverage (motivation, teamwork, conflict/situational, strengths/weaknesses, at minimum) are both satisfied. Hard cap above that to prevent runaway sessions.

Note: the follow-up budget cap (step 2) isn't explicitly in the original brief — I'm adding it deliberately. Without a cap, the claim-chasing logic described in the brief (follow up on a follow-up on a follow-up) can spiral into interrogating one topic indefinitely, which breaks the "feels like a real HR conversation" goal more than it helps. Suggest max 2 chained follow-ups per topic before the engine is forced back to the bank.

## 6. RAG / knowledge architecture

```
Curated sources (company pages, editorial market content, HR question bank)
        ↓
Manual/semi-automated ingestion (chunk ~500–800 tokens)
        ↓
Embedding (Gemini embedding model — exact model id to confirm at implementation time)
        ↓
pgvector column on KnowledgeSource, written/queried via Prisma $queryRaw
        ↓
Retrieval: embed the current interview topic/question context, cosine-similarity
top-k search, filtered by companyId and sourceType
        ↓
Injected into the orchestrator prompt with source + retrievedAt metadata attached,
so the model can cite "based on public recruitment information, last verified <date>"
rather than asserting it as fact
```

Start small: the initial 10 companies from the brief, the curated HR question bank, and editorial market-trend content. No scraping pipeline in V1.

## 7. Prompt architecture

Five distinct prompt roles, not one mega-prompt:

1. **Interview orchestrator** (per turn) — system prompt encodes the rules from the brief (stay in selected language, one question at a time, never invent company facts, never claim universality, distinguish language limitation from answer-quality limitation, etc.), plus candidate profile summary, job description summary, retrieved company context, recent turn history, and current claim memory. Constrained JSON output: `{ action: "follow_up" | "next_bank_question", questionDe, questionEn, internalReasoning }` — `internalReasoning` is logged, never shown to the candidate.
2. **Claim extraction** (per turn) — cheap, structured-output only: topics, claims, vagueness flags.
3. **Evaluation** (end of interview) — takes full transcript + claim memory + speech metrics, produces the four score blocks (language, performance, speech delivery, cultural communication), each with sub-scores and a short grounded explanation — never a bare number.
4. **CV/Lebenslauf coaching** — section-by-section: keyword suggestions, tone correction toward German professional conventions, structural feedback (no objective statement, reverse-chronological, etc.), optionally proposing replacement phrasing.
5. **Job description analyzer** — structured field extraction plus the language-requirement classification (`EXPLICIT`/`PREFERRED`/`NOT_EXPLICIT`/`UNCLEAR`), explicitly barred from inferring legal requirements beyond what the posting states.

## 8. Speech pipeline

```
Browser MediaRecorder captures answer audio
        ↓
Upload audio blob to Supabase Storage
        ↓
Self-hosted Whisper service transcribes (separate deployment from the Next.js app —
e.g. a small always-on host or a free-tier inference space, not a Vercel function)
        ↓
Transcript + word-level timestamps returned
        ↓
Metrics computed: words/minute, pause count (gaps above a threshold, e.g. 1.5s),
filler word frequency (curated filler-word list per language: "äh"/"ähm"/"also" for
German, "um"/"uh"/"like" for English)
        ↓
Transcript feeds the orchestrator + claim extraction prompts;
metrics are stored on SpeechMetric and feed the speech delivery score only
```

## 9. Evaluation rubric

Four separate score blocks, never merged into one number without breakdown:

- **German/English language**: grammar, vocabulary, fluency, comprehension, professional language usage.
- **Interview performance**: relevance, structure, motivation, professionalism, follow-up handling.
- **Speech delivery**: pacing, hesitation/pause frequency, filler words — framed as delivery indicators, not psychological confidence.
- **Cultural/workplace communication**: formality, Sie/du appropriateness, clarity, cultural awareness.

Every score requires a one-line grounded explanation generated alongside it — scores without explanation are not acceptable output from the evaluation prompt.

## 10. Auth design

- Signup/login issue an access JWT (15 min) and refresh JWT (7 days), both `httpOnly`, `secure`, `sameSite=strict` cookies.
- Refresh tokens are stored hashed in `RefreshToken`, rotated on every use (old one marked revoked, new one issued), with reuse-of-a-revoked-token treated as a theft signal that revokes the full session chain for that user.
- Passwords hashed with bcrypt.
- JWT secret and refresh secret are supplied via environment variables (provided by the project owner, not generated by the app).

## 11. Phased milestones

```
Phase 1 — Foundation [scaffolded]
  Next.js scaffold, Prisma schema + migrations on Supabase Postgres,
  custom JWT auth (signup/login/refresh/logout), candidate profile CRUD, dashboard shell.
  Status: all code written and building cleanly. Migration against a real database is the
  one remaining manual step — see "Phase 1 implementation notes" below.

Phase 2 — Interview knowledge base [done]
  Question bank schema (added `code` and `purpose` fields); seeded with a 100-question HR
  bank spanning all 10 categories from the brief (introduction, motivation, why Germany,
  company-specific, strengths/weaknesses, teamwork, situational, German workplace culture,
  relocation, salary/closing) — exceeds the ~30-50 MVP target. German/English pairs, CEFR level,
  difficulty, purpose, and follow-up topics per question. Verified end-to-end (migrated + seeded
  + queried) against a local `prisma dev` database — see notes below.

Phase 3 — Basic adaptive interview (text-only)   <- proof-of-concept gate
  Orchestrator + claim extraction + follow-up decision logic working end-to-end
  via typed input, no voice yet. This proves the adaptive logic before any audio investment.

Phase 4 — Voice
  MediaRecorder integration, self-hosted Whisper service deployed, transcript
  pipeline wired into the Phase 3 engine.

Phase 5 — Language + speech evaluation
  Evaluation prompt wired up, speech metrics computed and stored.

Phase 6 — CV/Lebenslauf + job description analyzer
  CV upload/parsing, section-level AI coaching, job description structured
  extraction + language-requirement classification.

Phase 7 — Company knowledge + RAG
  Initial 10 companies seeded, KnowledgeSource + embeddings + retrieval wired
  into the orchestrator prompt.

Phase 8 — Full report + feedback loop
  Combined report (all four score blocks), strengths/weaknesses, recommendations,
  practice-weak-areas, retry interview.

Phase 9 (stretch) — Editorial market content, dashboard polish.
```

MVP is complete when Phases 1–5 plus a minimal version of 6–8 work end-to-end for a single real interview: profile in, voice HR interview in German, adaptive follow-ups, separate language/performance/speech scores, actionable feedback, retry.

## 12. UI/UX direction

Decided visually (mockup built, approved on trust rather than visual review — revisit if it looks wrong once built for real):

- **Two separate language settings, not one.** `uiLanguage` (de/en) controls chrome copy — navigation, buttons, instructions — and defaults to simplified A1-A2 German once a candidate is inside the product, with a persistent, always-visible toggle (not buried in settings). The landing/signup screens before login default to English or a clear bilingual split, since a true German beginner can't self-rescue via the toggle before they've even reached it. This is completely independent of the interview's own language/difficulty setting (Beginner/Intermediate/Advanced), which spans the full range and is never capped at A1-A2 — the HR interview itself needs to sound like a real interviewer, especially at Advanced.
- **Color**: not literal black/red/gold flag blocks (reads as a government page, not a career platform). Instead:
  - Ground (background): `#FAF7F2` — warm off-white
  - Ink (text/dark neutral): `#1E1B19` — near-black, softened
  - Red accent (primary/CTA): `#B3402C` — muted brick-red
  - Gold accent (secondary/highlight): `#C99A2E` — warm muted gold
  - Supporting: card white `#FFFFFF`, border gray `#E8E2DA`, muted text `#6B6460`/`#8A837D`, soft tints `#F6E4E0` (red) / `#F6EBD2` (gold)
  - Used sparingly — accents on progress bars, active nav states, one primary button color — not as large blocks.
- **Typography**: Space Grotesk for headings, IBM Plex Sans for body — chosen over Inter/Roboto/Arial specifically to avoid the generic-AI-product look; Plex Sans also renders German diacritics (ä/ö/ü/ß) cleanly.
- **Placeholder product name**: "Einstieg" (German for "career entry") — just a placeholder, swap freely.
- Component direction: clean SaaS-style layout (sidebar nav + card-based dashboard), selectable chips/segmented controls/cards for interview setup (company, difficulty, interview type), not default browser form controls.

## 13. Phase 1 implementation notes

Things that came up while actually building Phase 1 that weren't knowable at planning time:

- **Prisma 7 requires an explicit driver adapter** — the query-engine-binary model from older Prisma versions is gone; `PrismaClient` now needs a driver adapter passed in explicitly. We use `@prisma/adapter-pg` (`src/lib/prisma.ts`). `DIRECT_URL`/`DATABASE_URL` in `.env` are unaffected, this only changes how the app's own client connects.
- **Next.js 16 renamed `middleware.ts` to `proxy.ts`** (`export function proxy(...)` instead of `middleware`). Already migrated via the official codemod — this is `src/proxy.ts`.
- **`cacheComponents` (Next 16's static-by-default rendering mode) is off** in `next.config.ts`. Nearly every route here is per-user/dynamic (auth-gated), so it fought the app more than it helped; worth reconsidering once there's real public/static content (Phase 9 editorial pages).
- Middleware/proxy does a **cookie-presence check only**, not full JWT verification — the Edge runtime those files run in can't use `jsonwebtoken`. Real verification happens server-side in each protected page via `getCurrentUserId()` (Node runtime, Server Components/Route Handlers).
- A lightweight custom i18n layer was added (`src/lib/i18n/`) — a cookie (`ui_lang`) plus plain dictionaries, no routing/library — to implement the uiLanguage/interview-language split from section 12, scoped down from something like `next-intl` since the app doesn't need URL-based locales.
- **Prisma 7 also removed `datasource.url`/`directUrl` from `schema.prisma` entirely** — both now live in `prisma7.config.ts`, and only one `url` is supported there (no separate directUrl key). For Supabase: point that config's `url` at the **direct** (non-pooled) connection, since CLI operations (migrate's shadow-database creation, in particular) can't run through the pgbouncer pooler — the running app connects separately and still uses the pooled `DATABASE_URL` via the adapter in `src/lib/prisma.ts`.
- The full Phase 1 + Phase 2 flow (migrate → generate → seed → signup → profile → dashboard → logout) was verified end-to-end against a real (local, throwaway) Postgres instance via `prisma dev`, not just compiled — this caught the config issues above before they'd hit the real Supabase setup.

### Manual steps still needed before this runs against a real database

1. Create a Supabase project, fill in `.env` with the real `DATABASE_URL`/`DIRECT_URL` (see `.env.example` for the shape) and generate `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` (e.g. `openssl rand -base64 48`).
2. Run `npx prisma migrate dev --name init` to create the tables.
3. `npm run dev` and visit `/signup` to create the first account.

## 14. Open items to resolve during implementation, not now

- Exact Gemini embedding model id for the RAG pipeline.
- Self-hosted Whisper deployment target (HF Space vs small VPS vs other) and model size (accuracy vs latency trade-off).
- Filler-word lists per language (needs a short curated list, not research).
- Final enum value sets (CEFR levels, question categories, difficulty tiers).
