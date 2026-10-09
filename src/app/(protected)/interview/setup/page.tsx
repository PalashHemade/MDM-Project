import { redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/getUiLanguage";
import { AppShell } from "@/components/AppShell";
import { InterviewSetupForm } from "@/components/InterviewSetupForm";

export default async function InterviewSetupPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const { t } = await getDictionary();

  return (
    <AppShell active="interview">
      <div className="flex flex-col gap-6 pt-2">
        <div>
          <h1 className="text-2xl font-semibold">{t.interviewSetup.title}</h1>
          <p className="mt-1 text-sm text-ink-soft">{t.interviewSetup.subtitle}</p>
        </div>
        <InterviewSetupForm t={t.interviewSetup} />
      </div>
    </AppShell>
  );
}
