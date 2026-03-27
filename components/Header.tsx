import Image from "next/image";
import Link from "next/link";
import NavItems from "./NavItems";
import UserDropdown from "./UserDropdown";
import { searchStocks } from "@/lib/actions/finnhub.actions";

export async function Header({ user }: { user: User | null }) {
  const initialStocks = await searchStocks();
  return (
    <header className={user ? "header" : "header-pill"}>
      <div className="header-wrapper">
        <Link href="/">
          <Image
            src="/logo.png"
            alt="TradXpert"
            width={800}
            height={1024}
            className="h-8 w-auto cursor-pointer"
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