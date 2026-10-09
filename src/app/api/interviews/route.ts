import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth/session";
import { startInterview } from "@/lib/interview/engine";
import { Difficulty, InterviewType, InterviewLanguage } from "@/generated/prisma/enums";

const setupSchema = z.object({
  language: z.enum(Object.values(InterviewLanguage) as [string, ...string[]]).default("DE"),
  difficulty: z.enum(Object.values(Difficulty) as [string, ...string[]]).default("INTERMEDIATE"),
  type: z.enum(Object.values(InterviewType) as [string, ...string[]]).default("GENERAL"),
});

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await prisma.candidateProfile.findUnique({ where: { userId } });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const parsed = setupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { interview, turn } = await startInterview(
    profile.id,
    parsed.data.language as "DE" | "EN",
    parsed.data.difficulty as Difficulty,
    parsed.data.type as InterviewType,
  );

  return NextResponse.json({ interviewId: interview.id, turn }, { status: 201 });
}
