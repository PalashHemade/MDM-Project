import { NextRequest, NextResponse } from "next/server";
import { revokeRefreshToken } from "@/lib/auth/tokens";
import { clearAuthCookies, REFRESH_COOKIE } from "@/lib/auth/cookies";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
  const res = NextResponse.json({ ok: true });
  clearAuthCookies(res);
  return res;
}
