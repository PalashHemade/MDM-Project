import { generateJson } from "@/lib/llm/gemini";

const SYSTEM_INSTRUCTION = `You are helping an international candidate prepare a professional CV (Lebenslauf) for the German job market. You are given raw text extracted from their uploaded CV file.

Extract ONLY information that is actually present in the text. Never invent experience, projects, skills, or achievements. If something is unclear or missing, leave it out rather than guessing.

Respond with ONLY a JSON object, no markdown, matching exactly this shape:
{
  "degree": string | null,
  "university": string | null,
  "experiences": [{ "company": string, "role": string, "startDate": string, "endDate": string | null, "description": string, "isInternship": boolean }],
  "projects": [{ "title": string, "description": string, "technologies": string[], "role": string | null }],
  "skills": [{ "name": string, "category": string | null, "proficiency": string | null }],
  "hobbies": string[],
  "interests": string[],
  "suggestions": [{ "section": string, "issue": string, "suggestion": string }]
}

Rules:
- "startDate"/"endDate" are ISO date strings like "2021-09-01" (use day "01" when only month/year is known in the source). "endDate" is null only if the position is explicitly current/ongoing.
- "isInternship" is true only if the text itself describes the role as an internship/Praktikum/working student position.
- "skills": one individual skill per entry, not a comma-separated blob.
- "suggestions": concrete, specific coaching feedback for improving this CV for German job applications — tone, structure, keyword usage, professionalism. Ground every suggestion in something actually present in the text; never invent a flaw that isn't there. Base feedback on standard German Lebenslauf conventions: strict reverse-chronological order, no objective/summary statement, concise bullet points starting with strong action verbs, quantified achievements where possible, consistent formal tone. "section" names the part of the CV it refers to (e.g. "Berufserfahrung", "Ausbildung", "Allgemein").`;

export interface CvAnalysisResult {
  degree: string | null;
  university: string | null;
  experiences: {
    company: string;
    role: string;
    startDate: string;
    endDate: string | null;
    description: string;
    isInternship: boolean;
  }[];
  projects: { title: string; description: string; technologies: string[]; role: string | null }[];
  skills: { name: string; category: string | null; proficiency: string | null }[];
  hobbies: string[];
  interests: string[];
  suggestions: { section: string; issue: string; suggestion: string }[];
}

export async function analyzeCv(cvText: string): Promise<CvAnalysisResult | null> {
  const result = await generateJson<CvAnalysisResult>(SYSTEM_INSTRUCTION, cvText.slice(0, 20000));
  if (!result || !Array.isArray(result.experiences) || !Array.isArray(result.suggestions)) {
    return null;
  }
  return result;
}
