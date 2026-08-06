import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import MarketPulseClient from "./MarketPulseClient";

export const metadata = {
  title: "Market Pulse | TradeXpert",
  description: "Live market movers — most actives, gainers and losers.",
};

export default async function MarketPulsePage() {
  const session = await auth!.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/sign-in");

  return <MarketPulseClient />;
}
