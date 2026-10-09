import type { CandidateProfile } from "@/generated/prisma/client";

export function computeProfileCompleteness(profile: CandidateProfile): number {
  const checks = [
    Boolean(profile.currentCountry),
    Boolean(profile.degree),
    Boolean(profile.university),
    profile.germanLevel !== "NONE",
    profile.englishLevel !== "NONE",
    profile.targetLocation !== "OPEN",
    profile.targetCompanyType !== "OPEN",
    Boolean(profile.careerGoals),
    profile.hobbies.length > 0,
  ];
  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}
