import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { auth } from "@/lib/better-auth/auth";
import { Card } from "@/components/ui/card";
import { TOOLS_ITEMS } from "@/lib/constants";

export const metadata = {
  title: "Tools | TradeXpert",
  description:
    "Portfolio optimization, valuation, market and mutual fund tools.",
};

export default async function ToolsPage() {
  const session = await auth!.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect("/sign-in");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Tools</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Quantitative tools for portfolio construction, valuation and market
          research.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS_ITEMS.map((tool) => (
          <Link key={tool.href} href={tool.href} className="group">
            <Card className="h-full p-5 bg-zinc-900 border-zinc-800 transition-colors hover:border-yellow-500/50">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-white group-hover:text-yellow-500 transition-colors">
                  {tool.label}
                </h2>
                <ArrowRight className="size-4 text-zinc-500 group-hover:text-yellow-500 transition-colors" />
              </div>
              <p className="mt-2 text-sm text-zinc-400">{tool.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
