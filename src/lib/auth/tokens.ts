import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  REFRESH_TOKEN_TTL_MS,
} from "./jwt";
import { hashToken } from "./tokenHash";

async function issueTokenPair(userId: string, email: string) {
  const accessToken = signAccessToken({ sub: userId, email });

  const tokenId = randomUUID();
  const refreshToken = signRefreshToken({ sub: userId, jti: tokenId });
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await prisma.refreshToken.create({
    data: { id: tokenId, userId, tokenHash: hashToken(refreshToken), expiresAt },
  });

  return { accessToken, refreshToken, tokenId };
}

export { issueTokenPair };

/**
 * Verifies and rotates a refresh token: the old one is marked revoked and
 * linked to its replacement. Reuse of an already-revoked token is treated as
 * a theft signal and revokes every other active session for that user.
 */
export async function rotateRefreshToken(refreshTokenRaw: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshTokenRaw);
  } catch {
    return null;
  }

  const existing = await prisma.refreshToken.findUnique({ where: { id: payload.jti } });
  if (!existing || existing.userId !== payload.sub) return null;
  if (existing.tokenHash !== hashToken(refreshTokenRaw)) return null;

  if (existing.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: existing.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return null;
  }

  if (existing.expiresAt < new Date()) return null;

  const user = await prisma.user.findUnique({ where: { id: existing.userId } });
  if (!user) return null;

  const next = await issueTokenPair(user.id, user.email);

  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date(), replacedById: next.tokenId },
  });

  return { accessToken: next.accessToken, refreshToken: next.refreshToken, user };
}

export async function revokeRefreshToken(refreshTokenRaw: string): Promise<void> {
  try {
    const payload = verifyRefreshToken(refreshTokenRaw);
    await prisma.refreshToken.updateMany({
      where: { id: payload.jti, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } catch {
    // Invalid/expired token — nothing in the DB to revoke, cookies get cleared regardless.
  }
}
