import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE } from "@/lib/auth/cookies";

// Lightweight cookie-presence check only — not full JWT verification, which
// can't run in the Edge middleware runtime. Authoritative auth happens
// server-side in each protected layout/page via getCurrentUserId().
const PROTECTED_PREFIXES = ["/dashboard", "/profile"];
const AUTH_PAGES = ["/login", "/signup"];

export function proxy(req: NextRequest) {
  const hasAccessCookie = Boolean(req.cookies.get(ACCESS_COOKIE)?.value);
  const { pathname } = req.nextUrl;

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p)) && !hasAccessCookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (AUTH_PAGES.includes(pathname) && hasAccessCookie) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/login", "/signup"],
};
