import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth as authInstance } from "@/lib/better-auth/auth";
import { connectToDatabase } from "@/database/mongoose";
import { KiteSession } from "@/database/models/kite-session.model";
import { encryptToken, isTokenEncryptionAvailable } from "@/lib/kite/crypto";
import { createKiteClient, isKiteConfigured, isKiteOwner } from "@/lib/kite/client";

/**
 * Zerodha redirects the browser here with ?request_token=... after login, so
 * every exit path must be a redirect back into the app rather than raw JSON.
 */
export async function GET(request: NextRequest) {
  const back = (status: string, reason?: string) => {
    const url = new URL("/dashboard", request.url);
    url.searchParams.set("kite", status);
    if (reason) url.searchParams.set("kite_reason", reason);
    return NextResponse.redirect(url, 302);
  };

  try {
    if (!authInstance) return back("error", "auth_unavailable");

    const session = await authInstance.api.getSession({ headers: await headers() });
    if (!session?.user?.email) return back("error", "unauthorized");

    if (!isKiteOwner(session.user.email)) return back("error", "not_owner");
    if (!isKiteConfigured()) return back("error", "not_configured");
    if (!isTokenEncryptionAvailable()) return back("error", "no_token_secret");

    const requestToken = request.nextUrl.searchParams.get("request_token");
    if (!requestToken) {
      // Kite sends ?status=error when the user cancels or the checksum fails.
      return back("error", "missing_request_token");
    }

    const kc = createKiteClient();
    if (!kc) return back("error", "not_configured");

    const data = await kc.generateSession(requestToken, process.env.KITE_API_SECRET!.trim());
    if (!data?.access_token) return back("error", "no_access_token");

    const encrypted = encryptToken(data.access_token);
    const now = new Date();

    await connectToDatabase();
    await KiteSession.findOneAndUpdate(
      { userEmail: session.user.email.toLowerCase() },
      {
        $set: {
          userEmail: session.user.email.toLowerCase(),
          accessToken: encrypted.ciphertext,
          accessTokenIv: encrypted.iv,
          accessTokenTag: encrypted.tag,
          publicToken: data.public_token,
          kiteUserId: data.user_id,
          // Reset the daily-expiry clock on every fresh login.
          createdAt: now,
          updatedAt: now,
        },
      },
      { upsert: true, new: true }
    );

    return back("connected");
  } catch (error) {
    console.error("Kite callback error:", error);
    return back("error", "exchange_failed");
  }
}
