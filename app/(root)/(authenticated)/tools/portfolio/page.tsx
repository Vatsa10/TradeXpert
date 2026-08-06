import { headers } from "next/headers";
import { redirect } from "next/navigation";

import MonteCarloSimulator from "@/components/tools/MonteCarloSimulator";
import PortfolioOptimizer from "@/components/tools/PortfolioOptimizer";
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
    <div className="space-y-6 sm:space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-100 sm:text-3xl">Portfolio Lab</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-500 sm:text-base">
          Size your allocations with risk-parity and mean-variance models, then pressure-test
          your trading edge across thousands of simulated sequences.
        </p>
      </header>

      <PortfolioOptimizer />
      <MonteCarloSimulator />
    </div>
  );
}
