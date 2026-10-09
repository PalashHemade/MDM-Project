"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CandidateProfile } from "@/generated/prisma/client";
import { CEFRLevel, TargetLocation, TargetCompanyType } from "@/generated/prisma/enums";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type ProfileFields = Pick<
  CandidateProfile,
  | "name"
  | "currentCountry"
  | "degree"
  | "university"
  | "germanLevel"
  | "englishLevel"
  | "targetLocation"
  | "targetCompanyType"
  | "careerGoals"
>;

export function ProfileForm({ profile, t }: { profile: CandidateProfile; t: Dictionary["profile"] }) {
  const router = useRouter();
  const [fields, setFields] = useState<ProfileFields>({
    name: profile.name,
    currentCountry: profile.currentCountry,
    degree: profile.degree,
    university: profile.university,
    germanLevel: profile.germanLevel,
    englishLevel: profile.englishLevel,
    targetLocation: profile.targetLocation,
    targetCompanyType: profile.targetCompanyType,
    careerGoals: profile.careerGoals,
  });
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  function update<K extends keyof ProfileFields>(key: K, value: ProfileFields[K]) {
    setFields((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    setStatus("saved");
    router.refresh();
  }

  const inputClass =
    "w-full rounded-[10px] border border-border bg-card px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-red";
  const labelClass = "mb-1.5 block text-[13px] font-semibold text-ink";

  return (
    <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-5 rounded-2xl border border-border bg-card p-6">
      <div>
        <label className={labelClass}>{t.name}</label>
        <input
          className={inputClass}
          value={fields.name}
          onChange={(e) => update("name", e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>{t.currentCountry}</label>
          <input
            className={inputClass}
            value={fields.currentCountry ?? ""}
            onChange={(e) => update("currentCountry", e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass}>{t.degree}</label>
          <input className={inputClass} value={fields.degree ?? ""} onChange={(e) => update("degree", e.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelClass}>{t.university}</label>
        <input
          className={inputClass}
          value={fields.university ?? ""}
          onChange={(e) => update("university", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>{t.germanLevel}</label>
          <select
            className={inputClass}
            value={fields.germanLevel}
            onChange={(e) => update("germanLevel", e.target.value as CandidateProfile["germanLevel"])}
          >
            {Object.values(CEFRLevel).map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>{t.englishLevel}</label>
          <select
            className={inputClass}
            value={fields.englishLevel}
            onChange={(e) => update("englishLevel", e.target.value as CandidateProfile["englishLevel"])}
          >
            {Object.values(CEFRLevel).map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>{t.targetLocation}</label>
          <select
            className={inputClass}
            value={fields.targetLocation}
            onChange={(e) => update("targetLocation", e.target.value as CandidateProfile["targetLocation"])}
          >
            {Object.values(TargetLocation).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>{t.targetCompanyType}</label>
          <select
            className={inputClass}
            value={fields.targetCompanyType}
            onChange={(e) => update("targetCompanyType", e.target.value as CandidateProfile["targetCompanyType"])}
          >
            {Object.values(TargetCompanyType).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>{t.careerGoals}</label>
        <textarea
          className={inputClass}
          rows={3}
          value={fields.careerGoals ?? ""}
          onChange={(e) => update("careerGoals", e.target.value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "saving"}
          className="w-fit rounded-[10px] bg-red px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {t.save}
        </button>
        {status === "saved" && <span className="text-sm text-ink-soft">{t.saved}</span>}
      </div>
    </form>
  );
}
