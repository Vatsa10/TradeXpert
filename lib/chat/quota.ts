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

  const doc = await UserQuota.findOneAndUpdate(
    { userEmail, date },
    { $setOnInsert: { userEmail, date, standardCount: 0, proCount: 0 } },
    { upsert: true, new: true }
  );

  const isPro = mode === "pro" || mode === "thinking";
  const standardCount = doc.standardCount || 0;
  const proCount = doc.proCount || 0;

  if (standardCount >= DAILY_STANDARD_LIMIT) {
    return {
      allowed: false,
      standardCount,
      proCount,
      standardLimit: DAILY_STANDARD_LIMIT,
      proLimit: DAILY_PRO_LIMIT,
      reason: "Daily message limit reached",
    };
  }

  if (isPro && proCount >= DAILY_PRO_LIMIT) {
    return {
      allowed: false,
      standardCount,
      proCount,
      standardLimit: DAILY_STANDARD_LIMIT,
      proLimit: DAILY_PRO_LIMIT,
      reason: "Daily pro/thinking mode limit reached",
    };
  }

  const increment: Record<string, number> = { standardCount: 1 };
  if (isPro) increment.proCount = 1;

  await UserQuota.updateOne({ userEmail, date }, { $inc: increment });

  return {
    allowed: true,
    standardCount: standardCount + 1,
    proCount: isPro ? proCount + 1 : proCount,
    standardLimit: DAILY_STANDARD_LIMIT,
    proLimit: DAILY_PRO_LIMIT,
  };
}
