import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth as authInstance } from "@/lib/better-auth/auth";
import { getKiteSessionStatus, isKiteConfigured } from "@/lib/kite/client";

export async function GET() {
  try {
    if (!authInstance) {
      return NextResponse.json({ error: "Auth not initialized" }, { status: 500 });
    }

    const session = await authInstance.api.getSession({ headers: await headers() });
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const configured = isKiteConfigured();
    if (!configured) {
      return NextResponse.json({
        configured: false,
        connected: false,
        expiresInfo: null,
        kiteUserId: null,
      });
    }

    const status = await getKiteSessionStatus(session.user.email);
    return NextResponse.json({ configured: true, ...status });
  } catch (error) {
    console.error("Kite status error:", error);
    return NextResponse.json({ error: "Failed to read Kite status" }, { status: 500 });
  }
}
