import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth/session";

const experienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  startDate: z.string(),
  endDate: z.string().nullable(),
  description: z.string().optional().default(""),
  isInternship: z.boolean().default(false),
});
const projectSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(""),
  technologies: z.array(z.string()).default([]),
  role: z.string().nullable().optional(),
});
const skillSchema = z.object({
  name: z.string().min(1),
  category: z.string().nullable().optional(),
  proficiency: z.string().nullable().optional(),
});

const applySchema = z.object({
  degree: z.string().nullable().optional(),
  university: z.string().nullable().optional(),
  experiences: z.array(experienceSchema).default([]),
  projects: z.array(projectSchema).default([]),
  skills: z.array(skillSchema).default([]),
  hobbies: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
});

function parseDateSafe(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const profile = await prisma.candidateProfile.findUnique({ where: { userId } });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  // "manual" means the candidate filled this in by hand rather than uploading a CV —
  // same apply logic, just no CV record to look up or mark finalized.
  const cv = id === "manual" ? null : await prisma.cV.findUnique({ where: { id } });
  if (id !== "manual" && (!cv || cv.profileId !== profile.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = applySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const data = parsed.data;

  // Entries with a date the model couldn't produce in a parseable form are dropped
  // rather than failing the whole apply — everything else still gets saved.
  const validExperiences = data.experiences
    .map((e) => ({ ...e, startDateParsed: parseDateSafe(e.startDate) }))
    .filter((e): e is typeof e & { startDateParsed: Date } => e.startDateParsed !== null);

  await prisma.$transaction([
    ...(cv ? [prisma.cV.update({ where: { id: cv.id }, data: { status: "FINALIZED" as const } })] : []),
    prisma.candidateProfile.update({
      where: { id: profile.id },
      data: {
        degree: data.degree ?? undefined,
        university: data.university ?? undefined,
        hobbies: data.hobbies,
        interests: data.interests,
      },
    }),
    ...validExperiences.map((e) =>
      prisma.experience.create({
        data: {
          profileId: profile.id,
          company: e.company,
          role: e.role,
          startDate: e.startDateParsed,
          endDate: parseDateSafe(e.endDate),
          description: e.description,
          isInternship: e.isInternship,
        },
      }),
    ),
    ...data.projects.map((p) =>
      prisma.projectEntry.create({
        data: {
          profileId: profile.id,
          title: p.title,
          description: p.description,
          technologies: p.technologies,
          role: p.role ?? null,
        },
      }),
    ),
    ...data.skills.map((s) =>
      prisma.skillEntry.create({
        data: { profileId: profile.id, name: s.name, category: s.category ?? null, proficiency: s.proficiency ?? null },
      }),
    ),
  ]);

  return NextResponse.json({ ok: true });
}
