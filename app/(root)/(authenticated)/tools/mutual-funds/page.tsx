import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import MutualFundsClient from "./MutualFundsClient";

export const metadata = {
  title: "Mutual Funds | TradeXpert",
  description: "Search Indian mutual fund schemes, review NAV history and model SIP returns.",
};

export default async function MutualFundsPage() {
  const session = await auth!.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/sign-in");

  return <MutualFundsClient />;
}
