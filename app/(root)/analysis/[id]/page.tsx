
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AnalysisPageClient from "../AnalysisPageClient";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return {
    title: `Analysis ${id} | TradeXpert`,
    description: "Detailed AI-powered stock analysis report.",
  };
}

export default async function AnalysisIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth!.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) redirect("/sign-in");

  return <AnalysisPageClient id={id} />;
}
