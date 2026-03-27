import LandingPage from "@/components/LandingPage";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth!.api.getSession({ headers: await headers() });

  if (session) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
