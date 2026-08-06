// Per-user daily LLM quota, ported from
// cfa-agent-langgraph/backend/app/core/quota.py:1-115.
// Complements lib/chat/rate-limiter.ts (global concurrency/cooldown) with a
// per-user, per-day cost cap. Superusers bypass entirely.

import { connectToDatabase } from "@/database/mongoose";
import UserQuota from "@/database/models/quota.model";
import { Mode } from "./types";

const DAILY_STANDARD_LIMIT = parseInt(process.env.CHAT_DAILY_STANDARD_LIMIT || "50", 10);
const DAILY_PRO_LIMIT = parseInt(process.env.CHAT_DAILY_PRO_LIMIT || "10", 10);

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface QuotaCheckResult {
  allowed: boolean;
  standardCount: number;
  proCount: number;
  standardLimit: number;
  proLimit: number;
  reason?: string;
}

export async function checkAndIncrementQuota(
  userEmail: string,
  mode: Mode,
  isSuperuser = false
): Promise<QuotaCheckResult> {
  if (isSuperuser) {
    return {
      allowed: true,
      standardCount: 0,
      proCount: 0,
      standardLimit: DAILY_STANDARD_LIMIT,
      proLimit: DAILY_PRO_LIMIT,
    };
  }

  await connectToDatabase();
  const date = todayKey();
  const isPro = mode === "pro" || mode === "thinking";

  // Reserve the slot atomically: the filter itself enforces the limits, so two
  // concurrent requests for the same user can never both read an under-limit
  // count and both increment past it (the read-then-write version of this did).
  const filter: Record<string, unknown> = {
    userEmail,
    date,
    standardCount: { $lt: DAILY_STANDARD_LIMIT },
  };
  if (isPro) filter.proCount = { $lt: DAILY_PRO_LIMIT };

  const increment: Record<string, number> = { standardCount: 1 };
  if (isPro) increment.proCount = 1;

  // Mongoose 9 deprecates `new: true` in favour of the driver's `returnDocument`.
  const updated = await UserQuota.findOneAndUpdate(
    filter,
    { $inc: increment },
    { returnDocument: "after" }
  );

  if (updated) {
    return {
      allowed: true,
      standardCount: updated.standardCount || 0,
      proCount: updated.proCount || 0,
      standardLimit: DAILY_STANDARD_LIMIT,
      proLimit: DAILY_PRO_LIMIT,
    };
  }

  // No match: either today's doc doesn't exist yet, or a limit is exhausted.
  // Create it (upsert races are resolved by the unique {userEmail,date} index)
  // and retry the guarded increment once.
  try {
    await UserQuota.updateOne(
      { userEmail, date },
      { $setOnInsert: { userEmail, date, standardCount: 0, proCount: 0 } },
      { upsert: true }
    );
  } catch {
    // Duplicate key from a concurrent upsert — the doc now exists, retry below.
  }

  const retried = await UserQuota.findOneAndUpdate(
    filter,
    { $inc: increment },
    { returnDocument: "after" }
  );

  if (retried) {
    return {
      allowed: true,
      standardCount: retried.standardCount || 0,
      proCount: retried.proCount || 0,
      standardLimit: DAILY_STANDARD_LIMIT,
      proLimit: DAILY_PRO_LIMIT,
    };
  }

  const current = await UserQuota.findOne({ userEmail, date });
  const standardCount = current?.standardCount || 0;
  const proCount = current?.proCount || 0;

  return {
    allowed: false,
    standardCount,
    proCount,
    standardLimit: DAILY_STANDARD_LIMIT,
    proLimit: DAILY_PRO_LIMIT,
    reason:
      standardCount >= DAILY_STANDARD_LIMIT
        ? "Daily message limit reached"
        : "Daily pro/thinking mode limit reached",
  };
}
