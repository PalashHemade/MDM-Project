import { prisma } from "@/lib/prisma";
import { callOrchestrator } from "./orchestrator";
import type { Difficulty, Interview, InterviewTurn, QuestionCategory } from "@/generated/prisma/client";

// Minimum category breadth a session should hit before it's allowed to end
// (PLANNING.md section 5, step 5). Not exhaustive — just the core HR ground.
const CORE_COVERAGE_CATEGORIES = ["MOTIVATION", "TEAMWORK", "CONFLICT", "STRENGTHS", "WEAKNESSES"] as const;

const TARGET_TURNS = 8;
const HARD_CAP_TURNS = 14;
// Follow-up budget per topic chain — without this the claim-chasing logic can
// spiral into interrogating one topic indefinitely (see PLANNING.md section 5).
const MAX_CHAINED_FOLLOWUPS = 2;

async function countChainDepth(turnId: string): Promise<number> {
  let depth = 0;
  let current = await prisma.interviewTurn.findUnique({ where: { id: turnId } });
  while (current?.questionSource === "GENERATED_FOLLOWUP") {
    depth++;
    if (!current.parentTurnId) break;
    current = await prisma.interviewTurn.findUnique({ where: { id: current.parentTurnId } });
  }
  return depth;
}

async function pickNextBankQuestion(usedCodes: string[], coveredCategories: Set<QuestionCategory>, difficulty: Difficulty) {
  const uncoveredCore = CORE_COVERAGE_CATEGORIES.filter((c) => !coveredCategories.has(c));
  const notIn = usedCodes.length ? usedCodes : undefined;

  const attempts = [
    uncoveredCore.length ? { code: { notIn }, category: { in: uncoveredCore }, difficulty } : null,
    uncoveredCore.length ? { code: { notIn }, category: { in: uncoveredCore } } : null,
    { code: { notIn }, difficulty },
    { code: { notIn } },
  ].filter(Boolean) as object[];

  for (const where of attempts) {
    const candidates = await prisma.interviewQuestionBank.findMany({ where });
    if (candidates.length) {
      return candidates[Math.floor(Math.random() * candidates.length)];
    }
  }
  return null;
}

export async function startInterview(profileId: string, language: "DE" | "EN", difficulty: Difficulty, type: Interview["type"]) {
  const interview = await prisma.interview.create({
    data: { profileId, language, difficulty, type, status: "IN_PROGRESS", startedAt: new Date() },
  });

  const opener = await prisma.interviewQuestionBank.findFirst({
    where: { category: "INTRODUCTION", difficulty: "BEGINNER" },
  });

  const firstTurn = await prisma.interviewTurn.create({
    data: {
      interviewId: interview.id,
      sequence: 1,
      questionText: opener ? (language === "EN" ? opener.textEn : opener.textDe) : "Erzählen Sie uns bitte etwas über sich.",
      questionSource: "BANK",
      category: opener?.category ?? "INTRODUCTION",
      bankQuestionCode: opener?.code ?? null,
    },
  });

  return { interview, turn: firstTurn };
}

export async function processAnswer(interview: Interview, turn: InterviewTurn, answerText: string) {
  await prisma.interviewTurn.update({
    where: { id: turn.id },
    data: { transcript: answerText, answeredAt: new Date() },
  });

  const [profile, allTurns, existingClaims] = await Promise.all([
    prisma.candidateProfile.findUniqueOrThrow({ where: { id: interview.profileId } }),
    prisma.interviewTurn.findMany({ where: { interviewId: interview.id }, orderBy: { sequence: "asc" } }),
    prisma.interviewClaim.findMany({ where: { interviewId: interview.id } }),
  ]);

  const recentTurns = allTurns.slice(-6);
  const chainDepth = await countChainDepth(turn.id);

  const result = await callOrchestrator({
    profile,
    interview,
    recentTurns,
    claims: existingClaims,
    latestQuestion: turn.questionText,
    latestAnswer: answerText,
  });

  const claimsSoFar = [...existingClaims];
  for (const c of result.claims) {
    const existing = claimsSoFar.find((ec) => ec.topic === c.topic);
    if (existing) {
      await prisma.interviewClaim.update({
        where: { id: existing.id },
        data: { revisitedTurnIds: { push: turn.id } },
      });
    } else {
      const created = await prisma.interviewClaim.create({
        data: {
          interviewId: interview.id,
          turnId: turn.id,
          topic: c.topic,
          claimText: c.claimText,
          firstMentionedTurnId: turn.id,
        },
      });
      claimsSoFar.push(created);
    }
  }

  const coveredCategories = new Set(
    allTurns.map((t) => t.category).filter((c): c is NonNullable<typeof c> => Boolean(c)),
  );
  const usedCodes = allTurns.map((t) => t.bankQuestionCode).filter((c): c is string => Boolean(c));
  const coreCovered = CORE_COVERAGE_CATEGORIES.every((c) => coveredCategories.has(c));

  const wantsFollowUp =
    result.action === "follow_up" &&
    Boolean(result.followUpQuestionDe) &&
    Boolean(result.followUpQuestionEn) &&
    chainDepth < MAX_CHAINED_FOLLOWUPS;

  if (!wantsFollowUp && allTurns.length >= TARGET_TURNS && coreCovered) {
    await prisma.interview.update({ where: { id: interview.id }, data: { status: "COMPLETE", completedAt: new Date() } });
    return { status: "COMPLETE" as const };
  }
  if (allTurns.length >= HARD_CAP_TURNS) {
    await prisma.interview.update({ where: { id: interview.id }, data: { status: "COMPLETE", completedAt: new Date() } });
    return { status: "COMPLETE" as const };
  }

  if (wantsFollowUp) {
    const nextTurn = await prisma.interviewTurn.create({
      data: {
        interviewId: interview.id,
        sequence: allTurns.length + 1,
        questionText: interview.language === "EN" ? result.followUpQuestionEn! : result.followUpQuestionDe!,
        questionSource: "GENERATED_FOLLOWUP",
        parentTurnId: turn.id,
      },
    });
    return { status: "IN_PROGRESS" as const, turn: nextTurn };
  }

  const bankQ = await pickNextBankQuestion(usedCodes, coveredCategories, interview.difficulty);
  if (!bankQ) {
    await prisma.interview.update({ where: { id: interview.id }, data: { status: "COMPLETE", completedAt: new Date() } });
    return { status: "COMPLETE" as const };
  }

  const nextTurn = await prisma.interviewTurn.create({
    data: {
      interviewId: interview.id,
      sequence: allTurns.length + 1,
      questionText: interview.language === "EN" ? bankQ.textEn : bankQ.textDe,
      questionSource: "BANK",
      category: bankQ.category,
      bankQuestionCode: bankQ.code,
    },
  });
  return { status: "IN_PROGRESS" as const, turn: nextTurn };
}
