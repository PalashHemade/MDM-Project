import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { issueTokenPair } from "@/lib/auth/tokens";
import { setAuthCookies } from "@/lib/auth/cookies";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  const genericError = NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  if (!user) return genericError;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return genericError;

  const { accessToken, refreshToken } = await issueTokenPair(user.id, user.email);

  const res = NextResponse.json({ user: { id: user.id, email: user.email } });
  setAuthCookies(res, accessToken, refreshToken);
  return res;
}
