import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth/session";
import { getDictionary } from "@/lib/i18n/getUiLanguage";
import { computeProfileCompleteness } from "@/lib/profileCompleteness";
import { AppShell } from "@/components/AppShell";

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const profile = await prisma.candidateProfile.findUnique({ where: { userId } });
  if (!profile) redirect("/login");

  const { t } = await getDictionary();
  const completeness = computeProfileCompleteness(profile);

  const statCards = [
    { label: t.dashboard.profileCompletion, value: completeness, color: "bg-red" },
  ];

  return (
    <AppShell active="dashboard">
      <div className="flex flex-col gap-7 pt-2">
        <div>
          <h1 className="text-2xl font-semibold">{t.dashboard.greetingTitle(profile.name)}</h1>
          <p className="mt-1 text-sm text-ink-soft">{t.dashboard.greetingSub}</p>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
          {statCards.map((card) => (
            <div key={card.label} className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-5">
              <span className="text-[13px] font-medium text-ink-soft">{card.label}</span>
              <span className="font-heading text-3xl font-bold">{card.value}%</span>
              <div className="h-1.5 w-full rounded-full bg-border">
                <div className={`h-1.5 rounded-full ${card.color}`} style={{ width: `${card.value}%` }} />
              </div>
            </div>
          ))}

          <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-5 text-ink-faint">
            <span className="text-[13px] font-medium">{t.dashboard.noDataYet}</span>
            <span className="font-heading text-sm">—</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 rounded-2xl border border-border bg-card p-5 sm:max-w-sm">
          <span className="text-sm font-semibold">{t.dashboard.completeProfileTitle}</span>
          <span className="text-xs text-ink-faint">{t.dashboard.completeProfileSub}</span>
          <Link
            href="/profile"
            className="mt-1 w-fit rounded-[10px] bg-red px-3.5 py-2 text-[13px] font-semibold text-white"
          >
            {t.dashboard.completeProfileCta}
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
