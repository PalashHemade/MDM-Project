import { Sidebar } from "@/components/Sidebar";
import { LanguageToggle } from "@/components/LanguageToggle";
import { LogoutButton } from "@/components/LogoutButton";
import { getDictionary } from "@/lib/i18n/getUiLanguage";

export async function AppShell({
  active,
  children,
}: {
  active: "dashboard" | "profile" | "interview";
  children: React.ReactNode;
}) {
  const { lang, t } = await getDictionary();

  return (
    <div className="flex min-h-screen w-full bg-ground">
      <Sidebar nav={t.nav} active={active} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex justify-end gap-4 px-10 py-5">
          <LanguageToggle current={lang} />
          <LogoutButton label={t.dashboard.logout} />
        </div>
        <main className="flex-1 px-10 pb-12">{children}</main>
      </div>
    </div>
  );
}
