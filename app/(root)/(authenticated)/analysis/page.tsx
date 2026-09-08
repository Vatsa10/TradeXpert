
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Stock AI Analysis | TradeXpert",
  description: "Advanced AI-powered stock analysis and investment insights.",
};

import AnalysisPageClient from "./AnalysisPageClient";

export default async function AnalysisPage() {
  const session = await auth!.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect("/sign-in");

  return <AnalysisPageClient />;
}
