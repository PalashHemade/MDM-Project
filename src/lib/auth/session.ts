import { cookies } from "next/headers";
import { verifyAccessToken } from "./jwt";
import { ACCESS_COOKIE } from "./cookies";

/** Reads and verifies the access token cookie. Returns null if missing/invalid/expired. */
export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  try {
    return verifyAccessToken(token).sub;
  } catch {
    return null;
  }
}
