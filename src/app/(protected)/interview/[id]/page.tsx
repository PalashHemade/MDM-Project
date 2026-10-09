import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/getUiLanguage";
import { AppShell } from "@/components/AppShell";
import { InterviewConversation } from "@/components/InterviewConversation";

export default async function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const { id } = await params;
  const { t } = await getDictionary();

  const interview = await prisma.interview.findUnique({
    where: { id },
    include: { turns: { orderBy: { sequence: "asc" } }, profile: true },
  });

  if (!interview || interview.profile.userId !== userId) notFound();

  return (
    <AppShell active="interview">
      <InterviewConversation interviewId={interview.id} initialTurns={interview.turns} initialStatus={interview.status} t={t.interview} />
    </AppShell>
  );
}
