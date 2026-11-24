import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/getUiLanguage";
import { AppShell } from "@/components/AppShell";
import { CvUploadReview } from "@/components/CvUploadReview";

export default async function CvPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const profile = await prisma.candidateProfile.findUnique({
    where: { userId },
    include: { experiences: true, projects: true, skills: true },
  });
  if (!profile) redirect("/login");

  const { t } = await getDictionary();

  return (
    <AppShell active="cv">
      <div className="flex flex-col gap-6 pt-2">
        <div>
          <h1 className="text-2xl font-semibold">{t.cv.title}</h1>
          <p className="mt-1 text-sm text-ink-soft">{t.cv.subtitle}</p>
        </div>
        <CvUploadReview
          t={t.cv}
          existingExperiences={profile.experiences}
          existingProjects={profile.projects}
          existingSkills={profile.skills}
        />
      </div>
    </AppShell>
  );
}
