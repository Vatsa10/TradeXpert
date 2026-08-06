import Image from "next/image";
import Link from "next/link";
import NavItems from "./NavItems";
import UserDropdown from "./UserDropdown";
import { searchStocks } from "@/lib/actions/finnhub.actions";

export async function Header({ user }: { user: User | null }) {
  // Guests never see the search command or nav items — skip the Finnhub
  // fetch entirely so the landing page renders without a blocking API call.
  const initialStocks = user ? await searchStocks() : [];
  return (
    <header className={user ? "header" : "header-pill"}>
      <div className="header-wrapper">
        <Link href="/" className={user ? undefined : "logo-chip"}>
          <Image
            src="/logo.png"
            alt="TradXpert"
            width={800}
            height={1024}
            priority
            className={`w-auto cursor-pointer ${user ? "h-8" : "h-6"}`}
          />
        </Link>

        <nav className="hidden sm:block">
          <NavItems initialStocks={initialStocks} user={user} />
        </nav>

        <UserDropdown user={user} initialStocks={initialStocks} />
      </div>
    </header>
  );
};

export default Header