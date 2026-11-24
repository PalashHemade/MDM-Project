"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { Experience, ProjectEntry, SkillEntry } from "@/generated/prisma/client";
import { Button } from "@/components/ui/Button";

interface EditableExperience {
  company: string;
  role: string;
  startDate: string;
  endDate: string | null;
  description: string;
  isInternship: boolean;
}
interface EditableProject {
  title: string;
  description: string;
  technologies: string;
  role: string | null;
}
interface EditableSkill {
  name: string;
  category: string | null;
  proficiency: string | null;
}
interface Suggestion {
  section: string;
  issue: string;
  suggestion: string;
}

const emptyAnalysis = {
  degree: "" as string | null,
  university: "" as string | null,
  experiences: [] as EditableExperience[],
  projects: [] as EditableProject[],
  skills: [] as EditableSkill[],
  hobbies: "",
  interests: "",
  suggestions: [] as Suggestion[],
};

export function CvUploadReview({
  t,
  existingExperiences,
  existingProjects,
  existingSkills,
}: {
  t: Dictionary["cv"];
  existingExperiences: Experience[];
  existingProjects: ProjectEntry[];
  existingSkills: SkillEntry[];
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<"idle" | "review">("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cvId, setCvId] = useState<string>("manual");
  const [analysis, setAnalysis] = useState(emptyAnalysis);

  const inputClass =
    "w-full rounded-[10px] border border-border bg-card px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-red";
  const labelClass = "mb-1 block text-[12px] font-semibold text-ink-soft";

  async function handleAnalyze() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/cv/parse", { method: "POST", body: formData });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? t.errorGeneric);
      return;
    }
    const { cvId: id, analysis: result } = await res.json();
    setCvId(id);
    setAnalysis({
      degree: result.degree,
      university: result.university,
      experiences: result.experiences.map((e: EditableExperience) => ({ ...e })),
      projects: result.projects.map((p: { title: string; description: string; technologies: string[]; role: string | null }) => ({
        ...p,
        technologies: p.technologies.join(", "),
      })),
      skills: result.skills,
      hobbies: (result.hobbies ?? []).join(", "),
      interests: (result.interests ?? []).join(", "),
      suggestions: result.suggestions,
    });
    setStage("review");
  }

  function handleManual() {
    setCvId("manual");
    setAnalysis(emptyAnalysis);
    setStage("review");
  }

  async function handleApply() {
    setError(null);
    setLoading(true);

    const payload = {
      degree: analysis.degree || null,
      university: analysis.university || null,
      experiences: analysis.experiences,
      projects: analysis.projects.map((p) => ({
        ...p,
        technologies: p.technologies
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      })),
      skills: analysis.skills,
      hobbies: analysis.hobbies
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      interests: analysis.interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };

    const res = await fetch(`/api/cv/${cvId}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (!res.ok) {
      setError(t.errorGeneric);
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  function updateExperience(i: number, patch: Partial<EditableExperience>) {
    setAnalysis((a) => ({ ...a, experiences: a.experiences.map((e, idx) => (idx === i ? { ...e, ...patch } : e)) }));
  }
  function removeExperience(i: number) {
    setAnalysis((a) => ({ ...a, experiences: a.experiences.filter((_, idx) => idx !== i) }));
  }
  function addExperience() {
    setAnalysis((a) => ({
      ...a,
      experiences: [...a.experiences, { company: "", role: "", startDate: "", endDate: null, description: "", isInternship: false }],
    }));
  }

  function updateProject(i: number, patch: Partial<EditableProject>) {
    setAnalysis((a) => ({ ...a, projects: a.projects.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) }));
  }
  function removeProject(i: number) {
    setAnalysis((a) => ({ ...a, projects: a.projects.filter((_, idx) => idx !== i) }));
  }
  function addProject() {
    setAnalysis((a) => ({ ...a, projects: [...a.projects, { title: "", description: "", technologies: "", role: null }] }));
  }

  function updateSkill(i: number, patch: Partial<EditableSkill>) {
    setAnalysis((a) => ({ ...a, skills: a.skills.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }));
  }
  function removeSkill(i: number) {
    setAnalysis((a) => ({ ...a, skills: a.skills.filter((_, idx) => idx !== i) }));
  }
  function addSkill() {
    setAnalysis((a) => ({ ...a, skills: [...a.skills, { name: "", category: null, proficiency: null }] }));
  }

  if (stage === "idle") {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:max-w-xl">
          <div>
            <label className={labelClass}>{t.uploadLabel}</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="text-sm text-ink-soft file:mr-3 file:cursor-pointer file:rounded-[10px] file:border file:border-border file:bg-ground file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink file:transition-colors file:duration-150 hover:file:bg-border/40"
            />
            <p className="mt-1 text-xs text-ink-faint">{t.uploadHint}</p>
          </div>
          {error && <p className="text-sm text-red">{error}</p>}
          <div className="flex items-center gap-3">
            <Button type="button" onClick={handleAnalyze} disabled={loading} className="w-fit">
              {loading ? t.analyzing : t.analyzeButton}
            </Button>
            <span className="text-xs text-ink-faint">{t.orDivider}</span>
            <Button type="button" variant="secondary" onClick={handleManual} className="w-fit">
              {t.manualEntry}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 sm:max-w-xl">
          <span className="text-sm font-semibold">{t.existingTitle}</span>
          {existingExperiences.length === 0 && existingProjects.length === 0 && existingSkills.length === 0 ? (
            <p className="text-sm text-ink-faint">{t.noExistingData}</p>
          ) : (
            <div className="flex flex-col gap-2 text-sm">
              {existingExperiences.map((e) => (
                <div key={e.id}>
                  <span className="font-medium">{e.role}</span> — {e.company}
                </div>
              ))}
              {existingProjects.map((p) => (
                <div key={p.id}>
                  <span className="font-medium">{p.title}</span>
                </div>
              ))}
              {existingSkills.length > 0 && <div className="text-ink-soft">{existingSkills.map((s) => s.name).join(", ")}</div>}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
        <div>
          <span className="text-sm font-semibold">{t.reviewTitle}</span>
          <p className="text-xs text-ink-faint">{t.reviewSubtitle}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t.degree}</label>
            <input
              className={inputClass}
              value={analysis.degree ?? ""}
              onChange={(e) => setAnalysis((a) => ({ ...a, degree: e.target.value }))}
            />
          </div>
          <div>
            <label className={labelClass}>{t.university}</label>
            <input
              className={inputClass}
              value={analysis.university ?? ""}
              onChange={(e) => setAnalysis((a) => ({ ...a, university: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
        <span className="text-sm font-semibold">{t.experiencesTitle}</span>
        {analysis.experiences.map((e, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-[10px] border border-border p-3">
            <div className="grid grid-cols-2 gap-2">
              <input className={inputClass} placeholder={t.company} value={e.company} onChange={(ev) => updateExperience(i, { company: ev.target.value })} />
              <input className={inputClass} placeholder={t.role} value={e.role} onChange={(ev) => updateExperience(i, { role: ev.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                className={inputClass}
                title={t.startDate}
                value={e.startDate}
                onChange={(ev) => updateExperience(i, { startDate: ev.target.value })}
              />
              <input
                type="date"
                className={inputClass}
                title={t.endDate}
                value={e.endDate ?? ""}
                placeholder={t.present}
                onChange={(ev) => updateExperience(i, { endDate: ev.target.value || null })}
              />
            </div>
            <textarea
              className={inputClass}
              rows={2}
              placeholder={t.description}
              value={e.description}
              onChange={(ev) => updateExperience(i, { description: ev.target.value })}
            />
            <button type="button" onClick={() => removeExperience(i)} className="w-fit cursor-pointer text-xs font-medium text-red underline-offset-2 transition-colors hover:text-[#9c3625] hover:underline">
              {t.removeEntry}
            </button>
          </div>
        ))}
        <button type="button" onClick={addExperience} className="w-fit cursor-pointer text-sm font-medium text-red transition-colors hover:text-[#9c3625]">
          + {t.experiencesTitle}
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
        <span className="text-sm font-semibold">{t.projectsTitle}</span>
        {analysis.projects.map((p, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-[10px] border border-border p-3">
            <input className={inputClass} placeholder={t.projectTitle} value={p.title} onChange={(ev) => updateProject(i, { title: ev.target.value })} />
            <textarea
              className={inputClass}
              rows={2}
              placeholder={t.description}
              value={p.description}
              onChange={(ev) => updateProject(i, { description: ev.target.value })}
            />
            <input
              className={inputClass}
              placeholder={t.technologies}
              value={p.technologies}
              onChange={(ev) => updateProject(i, { technologies: ev.target.value })}
            />
            <button type="button" onClick={() => removeProject(i)} className="w-fit cursor-pointer text-xs font-medium text-red underline-offset-2 transition-colors hover:text-[#9c3625] hover:underline">
              {t.removeEntry}
            </button>
          </div>
        ))}
        <button type="button" onClick={addProject} className="w-fit cursor-pointer text-sm font-medium text-red transition-colors hover:text-[#9c3625]">
          + {t.projectsTitle}
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
        <span className="text-sm font-semibold">{t.skillsTitle}</span>
        <div className="flex flex-wrap gap-2">
          {analysis.skills.map((s, i) => (
            <div key={i} className="flex items-center gap-1 rounded-full border border-border bg-ground px-3 py-1.5">
              <input
                className="w-28 bg-transparent text-sm focus:outline-none"
                placeholder={t.skillName}
                value={s.name}
                onChange={(ev) => updateSkill(i, { name: ev.target.value })}
              />
              <button type="button" onClick={() => removeSkill(i)} className="cursor-pointer rounded px-1 text-xs font-semibold text-red transition-colors hover:bg-red-tint">
                ×
              </button>
            </div>
          ))}
        </div>
        <button type="button" onClick={addSkill} className="w-fit cursor-pointer text-sm font-medium text-red transition-colors hover:text-[#9c3625]">
          + {t.skillsTitle}
        </button>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-6">
        <label className={labelClass}>{t.hobbiesTitle}</label>
        <input
          className={inputClass}
          value={analysis.hobbies}
          onChange={(e) => setAnalysis((a) => ({ ...a, hobbies: e.target.value }))}
        />
      </div>

      {analysis.suggestions.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
          <span className="text-sm font-semibold">{t.suggestionsTitle}</span>
          {analysis.suggestions.map((s, i) => (
            <div key={i} className="rounded-[10px] bg-gold-tint p-3 text-sm">
              <span className="font-semibold">{s.section}:</span> {s.issue}
              <div className="mt-1 text-ink-soft">{s.suggestion}</div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red">{error}</p>}
      {success ? (
        <p className="text-sm font-medium text-ink">{t.appliedSuccess}</p>
      ) : (
        <Button type="button" onClick={handleApply} disabled={loading} className="w-fit">
          {loading ? t.applying : t.applyButton}
        </Button>
      )}
    </div>
  );
}
