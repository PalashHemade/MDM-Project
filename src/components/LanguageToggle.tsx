"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import type { UiLanguage } from "@/lib/i18n/dictionaries";

export function LanguageToggle({ current }: { current: UiLanguage }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setLang(lang: UiLanguage) {
    if (lang === current) return;
    fetch("/api/ui-language", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang }),
    }).then(() => {
      startTransition(() => router.refresh());
    });
  }

  const pillBase = "cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-colors duration-150";
  const active = "bg-red text-white hover:bg-[#9c3625]";
  const inactive = "text-ink-soft hover:bg-border/60 hover:text-ink";

  return (
    <div className="flex items-center gap-1 rounded-full bg-[var(--color-border)]/40 p-1" aria-busy={isPending}>
      <button type="button" onClick={() => setLang("de")} className={`${pillBase} ${current === "de" ? active : inactive}`}>
        DE
      </button>
      <button type="button" onClick={() => setLang("en")} className={`${pillBase} ${current === "en" ? active : inactive}`}>
        EN
      </button>
    </div>
  );
}
