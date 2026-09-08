import { headers } from "next/headers";
import { redirect } from "next/navigation";

import MonteCarloSimulator from "@/components/tools/MonteCarloSimulator";
import PortfolioOptimizer from "@/components/tools/PortfolioOptimizer";
import { PageShell } from "@/components/system";
import { auth } from "@/lib/better-auth/auth";

export const metadata = {
  title: "Portfolio Lab | TradeXpert",
  description:
    "Optimize portfolio weights, inspect risk metrics and correlations, and Monte Carlo your trading edge.",
};

export default async function PortfolioLabPage() {
  const session = await auth!.api.getSession({ headers: await headers() });

  if (!session?.user) redirect("/sign-in");

  return (
    <PageShell
      width="wide"
      eyebrow="Tools"
      title="Portfolio Lab"
      description="Size your allocations with risk-parity and mean-variance models, then pressure-test your trading edge across thousands of simulated sequences."
    >
      <PortfolioOptimizer />
      <MonteCarloSimulator />
    </PageShell>
  );
}
