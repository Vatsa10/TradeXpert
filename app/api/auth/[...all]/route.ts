import { NextResponse } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";
import { auth as authInstance } from "@/lib/better-auth/auth";

// Mounts every Better-Auth endpoint (/api/auth/*): sign-in, sign-up, session,
// email verification and password reset callbacks. Without this route the
// client `authClient` calls and the links sent by email all 404.
//
// `auth` is built at module load and can be null if the MongoDB connection was
// never established, so the handler is resolved lazily and a 500 is returned
// instead of crashing the route (same guard style as the other API routes).
const handlers = authInstance ? toNextJsHandler(authInstance) : null;

function authUnavailable() {
  return NextResponse.json({ error: "Auth not initialized" }, { status: 500 });
}

export async function GET(request: Request) {
  if (!handlers) return authUnavailable();
  return handlers.GET(request);
}

export async function POST(request: Request) {
  if (!handlers) return authUnavailable();
  return handlers.POST(request);
}
