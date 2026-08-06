import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import PaperTradingClient from "@/components/paper/PaperTradingClient";

export const metadata = {
  title: "Paper Trading | TradeXpert",
  description: "Simulated Indian equity trading — no real orders are placed.",
};

export default async function PaperTradingPage() {
  const session = await auth!.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/sign-in");

  return <PaperTradingClient />;
}
