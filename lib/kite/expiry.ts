// Kite access tokens are invalidated daily at roughly 06:00 IST regardless of
// when they were issued. A token minted at 09:00 IST is dead ~21h later; one
// minted at 05:00 IST is dead in an hour. So expiry is a wall-clock boundary,
// not a duration.

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // UTC+05:30, India has no DST
const EXPIRY_HOUR_IST = 6;

/**
 * The first 06:00 IST instant strictly after `createdAt`.
 */
export function kiteSessionExpiryAt(createdAt: Date): Date {
  const ist = new Date(createdAt.getTime() + IST_OFFSET_MS);

  // Midnight IST of the createdAt day, expressed back in real UTC ms.
  const istMidnightUtcMs =
    Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - IST_OFFSET_MS;

  let expiry = istMidnightUtcMs + EXPIRY_HOUR_IST * 60 * 60 * 1000;
  if (expiry <= createdAt.getTime()) {
    expiry += 24 * 60 * 60 * 1000;
  }
  return new Date(expiry);
}

export function isKiteSessionExpired(createdAt: Date, now: Date = new Date()): boolean {
  return now.getTime() >= kiteSessionExpiryAt(createdAt).getTime();
}

export interface KiteExpiryInfo {
  expiresAt: string;
  expired: boolean;
  minutesRemaining: number;
}

export function describeKiteExpiry(createdAt: Date, now: Date = new Date()): KiteExpiryInfo {
  const expiresAt = kiteSessionExpiryAt(createdAt);
  const remainingMs = expiresAt.getTime() - now.getTime();
  return {
    expiresAt: expiresAt.toISOString(),
    expired: remainingMs <= 0,
    minutesRemaining: Math.max(0, Math.floor(remainingMs / 60000)),
  };
}
