import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PageShell } from "@/components/system";
import { auth } from "@/lib/better-auth/auth";
import ValuationClient from "@/components/tools/ValuationClient";

export const metadata = {
  title: "Valuation | TradeXpert",
  description:
    "Two-stage DCF valuation with WACC breakdown, sensitivity analysis and position sizing.",
};

export default async function ValuationToolPage() {
  const session = await auth!.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/sign-in");

  return (
    <PageShell
      width="wide"
      eyebrow="Tools"
      title="Valuation"
      description="Pull reported fundamentals, run a two-stage discounted cash flow, and stress the result across growth and discount-rate assumptions. Research output only — not investment advice."
    >
      <ValuationClient />
    </PageShell>
  );
}
