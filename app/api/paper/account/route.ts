import { NextRequest, NextResponse } from "next/server";
import { auth as authInstance } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { getPortfolio, resetAccount, DEFAULT_STARTING_CAPITAL } from "@/lib/paper/engine";

async function requireUserEmail() {
  if (!authInstance) return { error: NextResponse.json({ error: "Auth not initialized" }, { status: 500 }) };
  const session = await authInstance.api.getSession({ headers: await headers() });
  if (!session || !session.user?.email) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { email: session.user.email as string };
}

export async function GET() {
  try {
    const auth = await requireUserEmail();
    if (auth.error) return auth.error;

    const portfolio = await getPortfolio(auth.email!);
    return NextResponse.json({ mode: "PAPER", portfolio });
  } catch (error) {
    console.error("Paper account error:", error);
    return NextResponse.json({ error: "Failed to load paper account" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUserEmail();
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const requested = body?.startingCapital;
    const startingCapital =
      typeof requested === "number" && Number.isFinite(requested) && requested > 0
        ? requested
        : DEFAULT_STARTING_CAPITAL;

    const account = await resetAccount(auth.email!, startingCapital);
    return NextResponse.json({
      mode: "PAPER",
      reset: true,
      account: {
        startingCapital: account.startingCapital,
        cash: account.cash,
        createdAt: account.createdAt,
      },
    });
  } catch (error) {
    console.error("Paper account reset error:", error);
    return NextResponse.json({ error: "Failed to reset paper account" }, { status: 500 });
  }
}
