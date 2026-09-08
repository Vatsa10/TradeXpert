import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { auth } from "@/lib/better-auth/auth";
import { PageShell, Surface } from "@/components/system";
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
    <PageShell
      title="Tools"
      description="Quantitative tools for portfolio construction, valuation and market research."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {TOOLS_ITEMS.map((tool, index) => (
          <Link key={tool.href} href={tool.href} className="app-focus group rounded-xl">
            <Surface
              interactive
              padding="lg"
              className="app-enter h-full"
              style={{ "--i": index } as React.CSSProperties}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-ink transition-colors duration-200 [@media(hover:hover)]:group-hover:text-brand">
                  {tool.label}
                </h2>
                <ArrowRight
                  className="size-4 shrink-0 text-ink-faint transition-colors duration-200 [@media(hover:hover)]:group-hover:text-brand"
                  aria-hidden
                />
              </div>
              <p className="mt-2 text-sm text-ink-secondary">{tool.description}</p>
            </Surface>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
