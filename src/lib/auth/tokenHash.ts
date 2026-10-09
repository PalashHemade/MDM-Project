import { createHash } from "crypto";

/**
 * Refresh tokens are high-entropy signed JWTs already, so a fast deterministic
 * hash (rather than bcrypt) is enough to let us look them up by exact match
 * without storing the raw token string in the database.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
