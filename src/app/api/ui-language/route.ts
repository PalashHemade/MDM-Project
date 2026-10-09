import { NextRequest, NextResponse } from "next/server";
import { UI_LANG_COOKIE } from "@/lib/i18n/dictionaries";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const lang = body?.lang === "en" ? "en" : "de";

  const res = NextResponse.json({ lang });
  res.cookies.set(UI_LANG_COOKIE, lang, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
