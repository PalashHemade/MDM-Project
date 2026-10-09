import { getDictionary } from "@/lib/i18n/getUiLanguage";
import { LanguageToggle } from "@/components/LanguageToggle";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  const { lang, t } = await getDictionary();

  return (
    <div className="flex min-h-screen items-center justify-center bg-ground px-6">
      <div className="absolute right-6 top-6">
        <LanguageToggle current={lang} />
      </div>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-red" />
          <span className="font-heading text-lg font-bold">Einstieg</span>
        </div>
        <h1 className="text-xl font-semibold">{t.auth.logIn}</h1>
        <LoginForm t={t.auth} />
      </div>
    </div>
  );
}
