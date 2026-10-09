"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type Difficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type InterviewType = "GENERAL" | "GERMANY_FOCUSED" | "COMPANY_FOCUSED" | "JOB_FOCUSED";
type InterviewLanguage = "DE" | "EN";

export function InterviewSetupForm({ t }: { t: Dictionary["interviewSetup"] }) {
  const router = useRouter();
  const [language, setLanguage] = useState<InterviewLanguage>("DE");
  const [difficulty, setDifficulty] = useState<Difficulty>("INTERMEDIATE");
  const [type, setType] = useState<InterviewType>("GENERAL");
  const [loading, setLoading] = useState(false);

  const difficulties: { value: Difficulty; label: string }[] = [
    { value: "BEGINNER", label: t.beginner },
    { value: "INTERMEDIATE", label: t.intermediate },
    { value: "ADVANCED", label: t.advanced },
  ];
  const types: { value: InterviewType; label: string }[] = [
    { value: "GENERAL", label: t.general },
    { value: "GERMANY_FOCUSED", label: t.germanyFocused },
    { value: "COMPANY_FOCUSED", label: t.companyFocused },
    { value: "JOB_FOCUSED", label: t.jobFocused },
  ];

  async function handleStart() {
    setLoading(true);
    const res = await fetch("/api/interviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, difficulty, type }),
    });
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    router.push(`/interview/${data.interviewId}`);
  }

  const chip = (selected: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-medium ${
      selected ? "border-red bg-red-tint text-red" : "border-border bg-card text-ink"
    }`;

  return (
    <div className="flex max-w-xl flex-col gap-6 rounded-2xl border border-border bg-card p-6">
      <div>
        <span className="mb-2 block text-[13px] font-semibold">{t.languageLabel}</span>
        <div className="flex gap-2">
          <button type="button" className={chip(language === "DE")} onClick={() => setLanguage("DE")}>
            {t.german}
          </button>
          <button type="button" className={chip(language === "EN")} onClick={() => setLanguage("EN")}>
            {t.english}
          </button>
        </div>
      </div>

      <div>
        <span className="mb-2 block text-[13px] font-semibold">{t.difficultyLabel}</span>
        <div className="flex gap-2">
          {difficulties.map((d) => (
            <button key={d.value} type="button" className={chip(difficulty === d.value)} onClick={() => setDifficulty(d.value)}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-[13px] font-semibold">{t.typeLabel}</span>
        <div className="grid grid-cols-2 gap-2">
          {types.map((ty) => (
            <button key={ty.value} type="button" className={chip(type === ty.value)} onClick={() => setType(ty.value)}>
              {ty.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleStart}
        disabled={loading}
        className="w-fit rounded-[10px] bg-red px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {t.startButton}
      </button>
    </div>
  );
}
