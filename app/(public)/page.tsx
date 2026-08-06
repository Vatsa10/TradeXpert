import LandingPage from "@/components/LandingPage";

// Session redirect happens in proxy.ts (cookie check, pre-render) — this
// route has no headers()/session usage so it prerenders statically.
export default function Home() {
  return <LandingPage />;
}
