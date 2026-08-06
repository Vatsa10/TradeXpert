import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth as authInstance } from "@/lib/better-auth/auth";
import { KITE_NOT_CONFIGURED_MESSAGE, isKiteConfigured, kiteLoginUrl } from "@/lib/kite/client";

export async function GET() {
  try {
    if (!authInstance) {
      return NextResponse.json({ error: "Auth not initialized" }, { status: 500 });
    }

    const session = await authInstance.api.getSession({ headers: await headers() });
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isKiteConfigured()) {
      return NextResponse.json({ error: KITE_NOT_CONFIGURED_MESSAGE }, { status: 503 });
    }

    const url = kiteLoginUrl();
    if (!url) {
      return NextResponse.json({ error: KITE_NOT_CONFIGURED_MESSAGE }, { status: 503 });
    }

    return NextResponse.redirect(url, 302);
  } catch (error) {
    console.error("Kite login redirect error:", error);
    return NextResponse.json({ error: "Failed to start Kite login" }, { status: 500 });
  }
}
