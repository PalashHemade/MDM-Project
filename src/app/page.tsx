import Link from "next/link";
import { getDictionary } from "@/lib/i18n/getUiLanguage";
import { LanguageToggle } from "@/components/LanguageToggle";

export default async function LandingPage() {
  const { lang, t } = await getDictionary();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-ground px-6 text-center">
      <div className="absolute right-6 top-6">
        <LanguageToggle current={lang} />
      </div>
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-red" />
        <span className="font-heading text-xl font-bold">Einstieg</span>
      </div>
      <div className="flex max-w-lg flex-col gap-3">
        <h1 className="font-heading text-3xl font-bold">{t.landing.tagline}</h1>
        <p className="text-ink-soft">{t.landing.subtitle}</p>
      </div>
      <div className="flex gap-3">
        <Link href="/signup" className="rounded-[10px] bg-red px-5 py-2.5 text-sm font-semibold text-white">
          {t.landing.createAccount}
        </Link>
        <Link href="/login" className="rounded-[10px] border border-border px-5 py-2.5 text-sm font-semibold">
          {t.landing.logIn}
        </Link>
      </div>
    </div>
  );
}
