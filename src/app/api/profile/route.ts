import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth/session";
import { CEFRLevel, TargetLocation, TargetCompanyType } from "@/generated/prisma/enums";

const cefrValues = Object.values(CEFRLevel) as unknown as [CEFRLevel, ...CEFRLevel[]];
const targetLocationValues = Object.values(TargetLocation) as unknown as [TargetLocation, ...TargetLocation[]];
const targetCompanyTypeValues = Object.values(TargetCompanyType) as unknown as [
  TargetCompanyType,
  ...TargetCompanyType[],
];

const profileSchema = z.object({
  name: z.string().min(1),
  currentCountry: z.string().optional().nullable(),
  degree: z.string().optional().nullable(),
  university: z.string().optional().nullable(),
  germanLevel: z.enum(cefrValues).optional(),
  englishLevel: z.enum(cefrValues).optional(),
  targetLocation: z.enum(targetLocationValues).optional(),
  targetCompanyType: z.enum(targetCompanyTypeValues).optional(),
  preferredCities: z.array(z.string()).optional(),
  workAuthorizationStatus: z.string().optional().nullable(),
  careerGoals: z.string().optional().nullable(),
  hobbies: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
});

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await prisma.candidateProfile.findUnique({ where: { userId } });
  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const profile = await prisma.candidateProfile.update({
    where: { userId },
    data: parsed.data,
  });

  return NextResponse.json({ profile });
}
