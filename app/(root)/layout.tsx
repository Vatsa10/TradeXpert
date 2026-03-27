import Header from "@/components/Header";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";

const Layout = async ({ children }: { children: React.ReactNode }) => {
  const session = await auth!.api.getSession({ headers: await headers() });

  const user = session?.user ? {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
  } : null;

  return (
    <main className="min-h-screen text-gray-400 font-sans flex flex-col">
      <Header user={user} />
      <div className="flex flex-col flex-1">{children}</div>
    </main>
  );
};
export default Layout;
