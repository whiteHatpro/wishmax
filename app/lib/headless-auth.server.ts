import { createHash } from "node:crypto";
import prisma from "../db.server";

/**
 * SHA-256 hex digest used for storing and comparing headless API keys.
 * Keys are persisted hashed in `HeadlessApiKey.keyHash` and never stored in plaintext.
 */
export function hashKey(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

/**
 * Extract a candidate API key from `X-Wishmax-Key` or `Authorization: Bearer <key>`.
 * Returns `null` when neither header is present.
 */
export function getApiKeyFromRequest(request: Request): string | null {
  const direct = request.headers.get("X-Wishmax-Key");
  if (direct && direct.trim().length > 0) return direct.trim();

  const auth = request.headers.get("Authorization");
  if (auth) {
    const match = auth.match(/^Bearer\s+(.+)$/i);
    if (match && match[1].trim().length > 0) return match[1].trim();
  }
  return null;
}

/**
 * Look up active `HeadlessApiKey` rows for the shop and compare hashes.
 * Returns `false` for missing shop/key or no match. Never logs the raw value.
 */
export async function verifyHeadlessApiKey(
  shop: string,
  rawKey: string | null
): Promise<boolean> {
  if (!shop || !rawKey) return false;
  const hashed = hashKey(rawKey);
  const match = await prisma.headlessApiKey.findFirst({
    where: { shop, keyHash: hashed },
    select: { id: true },
  });
  return Boolean(match);
}
