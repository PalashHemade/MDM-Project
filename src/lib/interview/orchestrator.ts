import { generateJson } from "@/lib/llm/gemini";
import type { CandidateProfile, Interview, InterviewClaim, InterviewTurn } from "@/generated/prisma/client";

const SYSTEM_INSTRUCTION = `You are simulating a professional German HR interviewer conducting a behavioral/motivational job interview with an international candidate applying for a job in Germany.

Rules you must follow:
1. Stay strictly in the interview's language for any question text you generate.
2. Ask about one topic at a time.
3. Never invent facts about the candidate's target company. Never claim a company "always" does something.
4. Judge only the content of the candidate's answer — never their personality, confidence, or mental state.
5. Base your analysis only on what the candidate actually said, not assumptions.
6. If the candidate's answer is vague (states a feeling or conclusion like "I was very motivated" without a concrete reason, example, or detail), mark it vague and prefer a follow-up asking for a concrete example or reason.
7. Do not chase the same topic forever — if it has already been explored enough, prefer moving to a fresh question.

Respond with ONLY a JSON object, no markdown, matching exactly this shape:
{
  "claims": [{ "topic": string, "claimText": string, "isVague": boolean }],
  "action": "follow_up" | "next_bank_question",
  "followUpQuestionDe": string | null,
  "followUpQuestionEn": string | null
}

"claims": the concrete topics/facts the candidate's latest answer reveals. Keep "topic" short, lowercase, and reusable across turns (e.g. "motivation", "teamwork", "aws project") so repeated mentions of the same thing share the same topic string.
Set "action" to "follow_up" only when there is a genuinely useful, specific follow-up about something the candidate just said (especially if vague). Otherwise "next_bank_question".
When action is "follow_up": fill BOTH followUpQuestionDe and followUpQuestionEn (German/English translations of the same question), addressing the candidate formally ("Sie") in German. When action is "next_bank_question": set both to null.`;

export interface OrchestratorClaim {
  topic: string;
  claimText: string;
  isVague: boolean;
}

export interface OrchestratorResult {
  claims: OrchestratorClaim[];
  action: "follow_up" | "next_bank_question";
  followUpQuestionDe: string | null;
  followUpQuestionEn: string | null;
}

function buildUserPrompt(args: {
  profile: CandidateProfile;
  interview: Interview;
  recentTurns: InterviewTurn[];
  claims: InterviewClaim[];
  latestQuestion: string;
  latestAnswer: string;
}): string {
  const { profile, interview, recentTurns, claims, latestQuestion, latestAnswer } = args;

  const historyLines = recentTurns
    .filter((t) => t.answeredAt)
    .map((t) => `Q: "${t.questionText}"\nA: "${t.transcript ?? ""}"`)
    .join("\n\n");

  const claimLines = claims.map((c) => `- [${c.topic}] ${c.claimText}`).join("\n") || "(none yet)";

  return `Candidate profile:
- Name: ${profile.name}
- Target location: ${profile.targetLocation}
- Target company type: ${profile.targetCompanyType}
- German level: ${profile.germanLevel}
- Career goals: ${profile.careerGoals ?? "(not specified)"}

Interview language: ${interview.language === "EN" ? "English" : "German (formal 'Sie')"}
Difficulty: ${interview.difficulty}

Conversation so far:
${historyLines || "(this is the first exchange)"}

Known claims so far:
${claimLines}

Latest question asked: "${latestQuestion}"
Latest candidate answer: "${latestAnswer}"`;
}

export async function callOrchestrator(args: {
  profile: CandidateProfile;
  interview: Interview;
  recentTurns: InterviewTurn[];
  claims: InterviewClaim[];
  latestQuestion: string;
  latestAnswer: string;
}): Promise<OrchestratorResult> {
  const result = await generateJson<OrchestratorResult>(SYSTEM_INSTRUCTION, buildUserPrompt(args));

  if (!result || !Array.isArray(result.claims) || !result.action) {
    // Deterministic fallback keeps the interview moving even without a working API key.
    return { claims: [], action: "next_bank_question", followUpQuestionDe: null, followUpQuestionEn: null };
  }

  return result;
}
