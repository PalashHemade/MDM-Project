import { NextRequest, NextResponse } from "next/server";
import { rotateRefreshToken } from "@/lib/auth/tokens";
import { setAuthCookies, clearAuthCookies, REFRESH_COOKIE } from "@/lib/auth/cookies";

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const result = await rotateRefreshToken(refreshToken);
  if (!result) {
    const res = NextResponse.json({ error: "Session expired" }, { status: 401 });
    clearAuthCookies(res);
    return res;
  }

  const res = NextResponse.json({ user: { id: result.user.id, email: result.user.email } });
  setAuthCookies(res, result.accessToken, result.refreshToken);
  return res;
}
