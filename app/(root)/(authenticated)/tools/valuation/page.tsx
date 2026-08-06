import { headers } from "next/headers";
import { redirect } from "next/navigation";

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

  return <ValuationClient />;
}
