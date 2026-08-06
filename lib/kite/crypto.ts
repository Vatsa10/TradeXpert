// AES-256-GCM encryption for Kite access tokens at rest.
// Key comes from KITE_TOKEN_SECRET; if that is absent we derive one from
// BETTER_AUTH_SECRET (which always exists for the auth layer) so a deployment
// never silently stores plaintext broker tokens.

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

export interface EncryptedPayload {
  ciphertext: string; // base64
  iv: string; // base64
  tag: string; // base64
}

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // GCM standard nonce length

/**
 * Resolve the 32-byte key. Returns null when no secret is configured at all —
 * callers must treat that as "encryption unavailable" rather than crash.
 */
export function getTokenKey(): Buffer | null {
  const secret = process.env.KITE_TOKEN_SECRET || process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.trim().length === 0) return null;
  // sha256 gives us a stable 32-byte key from a secret of any length/format.
  return createHash("sha256").update(`kite:${secret}`).digest();
}

export function isTokenEncryptionAvailable(): boolean {
  return getTokenKey() !== null;
}

export function encryptToken(plaintext: string): EncryptedPayload {
  const key = getTokenKey();
  if (!key) {
    throw new Error("Cannot encrypt Kite token: set KITE_TOKEN_SECRET or BETTER_AUTH_SECRET");
  }

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
  };
}

/**
 * Returns null instead of throwing when the payload is malformed or the key has
 * rotated — a stale/undecryptable session should read as "not connected", not a
 * 500 on every request.
 */
export function decryptToken(payload: Partial<EncryptedPayload> | null | undefined): string | null {
  if (!payload || !payload.ciphertext || !payload.iv || !payload.tag) return null;

  const key = getTokenKey();
  if (!key) return null;

  try {
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(payload.iv, "base64"));
    decipher.setAuthTag(Buffer.from(payload.tag, "base64"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(payload.ciphertext, "base64")),
      decipher.final(),
    ]);
    return plaintext.toString("utf8");
  } catch {
    return null;
  }
}
