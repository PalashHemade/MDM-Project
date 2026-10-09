import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/getUiLanguage";
import { AppShell } from "@/components/AppShell";
import { ProfileForm } from "@/components/ProfileForm";

export default async function ProfilePage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const profile = await prisma.candidateProfile.findUnique({ where: { userId } });
  if (!profile) redirect("/login");

  const { t } = await getDictionary();

  return (
    <AppShell active="profile">
      <div className="flex flex-col gap-6 pt-2">
        <div>
          <h1 className="text-2xl font-semibold">{t.profile.title}</h1>
          <p className="mt-1 text-sm text-ink-soft">{t.profile.subtitle}</p>
        </div>
        <ProfileForm profile={profile} t={t.profile} />
      </div>
    </AppShell>
  );
}
