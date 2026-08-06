import Header from "@/components/Header";

// Public group: no session lookup anywhere, so these routes prerender
// statically. proxy.ts redirects signed-in visitors off "/" via the session
// cookie before rendering, so user is always null here.
const PublicLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="min-h-screen text-gray-400 font-sans flex flex-col">
      <Header user={null} />
      <div className="flex flex-col flex-1">{children}</div>
    </main>
  );
};

export default PublicLayout;
