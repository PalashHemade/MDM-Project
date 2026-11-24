import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth/session";
import { extractCvText, resolveCvMimeType } from "@/lib/cv/extractText";
import { analyzeCv } from "@/lib/cv/analyze";
import type { Prisma } from "@/generated/prisma/client";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await prisma.candidateProfile.findUnique({ where: { userId } });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
  }

  const resolvedType = resolveCvMimeType(file.type, file.name);
  if (!resolvedType) {
    return NextResponse.json(
      { error: "Unsupported file type. Please upload a PDF, DOCX, or plain text file." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let text: string;
  try {
    text = await extractCvText(buffer, resolvedType);
  } catch (err) {
    const message = err instanceof Error ? (err.stack ?? err.message) : String(err);
    console.error(
      `CV text extraction failed — file=${file.name} reportedType=${file.type} resolvedType=${resolvedType}\n${message}`,
    );
    return NextResponse.json(
      { error: "Could not read this file. It may be corrupted, password-protected, or scanned images rather than text." },
      { status: 400 },
    );
  }

  if (!text.trim()) {
    return NextResponse.json({ error: "Could not extract any text from this file." }, { status: 422 });
  }

  const analysis = await analyzeCv(text);
  if (!analysis) {
    return NextResponse.json({ error: "AI analysis is temporarily unavailable. Please try again shortly." }, { status: 503 });
  }

  const existingCount = await prisma.cV.count({ where: { profileId: profile.id } });

  const cv = await prisma.cV.create({
    data: {
      profileId: profile.id,
      structuredData: analysis as unknown as Prisma.InputJsonValue,
      aiSuggestions: analysis.suggestions as unknown as Prisma.InputJsonValue,
      status: "AI_REVIEWED",
      version: existingCount + 1,
    },
  });

  return NextResponse.json({ cvId: cv.id, analysis });
}
