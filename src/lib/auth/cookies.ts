import type { NextResponse } from "next/server";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

export function setAuthCookies(res: NextResponse, accessToken: string, refreshToken: string) {
  res.cookies.set(ACCESS_COOKIE, accessToken, { ...baseCookieOptions, maxAge: 15 * 60 });
  res.cookies.set(REFRESH_COOKIE, refreshToken, { ...baseCookieOptions, maxAge: 7 * 24 * 60 * 60 });
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, "", { ...baseCookieOptions, maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { ...baseCookieOptions, maxAge: 0 });
}
