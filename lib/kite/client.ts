import { KiteConnect } from "kiteconnect";

import { connectToDatabase } from "@/database/mongoose";
import { KiteSession } from "@/database/models/kite-session.model";
import { decryptToken } from "./crypto";
import { describeKiteExpiry, isKiteSessionExpired, type KiteExpiryInfo } from "./expiry";

export type KiteClient = InstanceType<typeof KiteConnect>;

export const KITE_NOT_CONFIGURED_MESSAGE =
  "Kite not configured: set KITE_API_KEY and KITE_API_SECRET in the environment.";

/** True only when both broker credentials are present. */
export function isKiteConfigured(): boolean {
  return Boolean(process.env.KITE_API_KEY?.trim() && process.env.KITE_API_SECRET?.trim());
}

// Kite is a PERSONAL broker integration: when KITE_OWNER_EMAIL is set, only
// that account may connect or consume Kite data — everyone else silently uses
// the public NSE/BSE providers instead.
export function isKiteOwner(userEmail: string | null | undefined): boolean {
  const owner = process.env.KITE_OWNER_EMAIL?.trim().toLowerCase();
  if (!owner) return true; // unset = single-user/dev deployment, no gating
  return !!userEmail && userEmail.trim().toLowerCase() === owner;
}

/**
 * A bare, unauthenticated client — enough for the login URL / token exchange.
 * Returns null when env keys are missing so callers degrade instead of throwing.
 */
export function createKiteClient(): KiteClient | null {
  const apiKey = process.env.KITE_API_KEY?.trim();
  if (!apiKey) return null;
  return new KiteConnect({ api_key: apiKey });
}

/** Zerodha-hosted login URL, or null when Kite is not configured. */
export function kiteLoginUrl(): string | null {
  const kc = createKiteClient();
  if (!kc) return null;
  try {
    return kc.getLoginURL();
  } catch {
    return null;
  }
}

export interface KiteSessionStatus {
  connected: boolean;
  kiteUserId: string | null;
  expiresInfo: KiteExpiryInfo | null;
}

/**
 * Look up the stored session without building a client. Used by /api/kite/status.
 */
export async function getKiteSessionStatus(userEmail: string): Promise<KiteSessionStatus> {
  if (!isKiteConfigured()) {
    return { connected: false, kiteUserId: null, expiresInfo: null };
  }

  try {
    await connectToDatabase();
    const doc = await KiteSession.findOne({ userEmail: userEmail.toLowerCase() }).lean();
    if (!doc) return { connected: false, kiteUserId: null, expiresInfo: null };

    const createdAt = new Date(doc.createdAt);
    const expiresInfo = describeKiteExpiry(createdAt);

    return {
      // A decryptable-but-expired token is not a usable connection.
      connected: !expiresInfo.expired && decryptToken(toPayload(doc)) !== null,
      kiteUserId: doc.kiteUserId ?? null,
      expiresInfo,
    };
  } catch (error) {
    console.error("Kite session status lookup failed:", error);
    return { connected: false, kiteUserId: null, expiresInfo: null };
  }
}

/**
 * Load + decrypt the user's session and return a client with the access token
 * already set. Returns null when Kite is unconfigured, the user has never
 * connected, the daily token has expired, or the ciphertext no longer decrypts.
 */
export async function getKiteForUser(userEmail: string): Promise<KiteClient | null> {
  if (!isKiteConfigured() || !userEmail || !isKiteOwner(userEmail)) return null;

  try {
    await connectToDatabase();
    const doc = await KiteSession.findOne({ userEmail: userEmail.toLowerCase() }).lean();
    if (!doc) return null;

    if (isKiteSessionExpired(new Date(doc.createdAt))) return null;

    const accessToken = decryptToken(toPayload(doc));
    if (!accessToken) return null;

    const kc = createKiteClient();
    if (!kc) return null;
    kc.setAccessToken(accessToken);
    return kc;
  } catch (error) {
    console.error("Failed to build Kite client:", error);
    return null;
  }
}

function toPayload(doc: { accessToken: string; accessTokenIv: string; accessTokenTag: string }) {
  return { ciphertext: doc.accessToken, iv: doc.accessTokenIv, tag: doc.accessTokenTag };
}
