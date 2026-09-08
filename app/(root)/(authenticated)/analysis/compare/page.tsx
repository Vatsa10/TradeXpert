
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import ComparisonView from "@/components/ComparisonView";

export const metadata = {
  title: "Compare Stock Reports | TradeXpert",
  description: "Compare AI-generated investment reports side-by-side.",
};

export default async function ComparisonPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const session = await auth!.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect("/sign-in");

  const { ids } = await searchParams;
  const requestIdArray = ids ? ids.split(",") : [];

  if (requestIdArray.length < 2) {
    redirect("/analysis");
  }

  return (
    <div className="min-h-screen w-full flex-1 bg-surface">
      <ComparisonView ids={requestIdArray} />
    </div>
  );
}
