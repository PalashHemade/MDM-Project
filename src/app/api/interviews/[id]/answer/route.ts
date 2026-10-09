import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth/session";
import { processAnswer } from "@/lib/interview/engine";

const answerSchema = z.object({
  turnId: z.string().min(1),
  answerText: z.string().min(1),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = answerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const interview = await prisma.interview.findUnique({ where: { id }, include: { profile: true } });
  if (!interview || interview.profile.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (interview.status === "COMPLETE") {
    return NextResponse.json({ error: "Interview already complete" }, { status: 409 });
  }

  const turn = await prisma.interviewTurn.findUnique({ where: { id: parsed.data.turnId } });
  if (!turn || turn.interviewId !== interview.id) {
    return NextResponse.json({ error: "Turn not found" }, { status: 404 });
  }
  if (turn.answeredAt) {
    return NextResponse.json({ error: "Turn already answered" }, { status: 409 });
  }

  const result = await processAnswer(interview, turn, parsed.data.answerText);
  return NextResponse.json(result);
}
