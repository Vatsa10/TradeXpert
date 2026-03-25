import Image from "next/image";
import Link from "next/link";
import NavItems from "./NavItems";
import UserDropdown from "./UserDropdown";
import { searchStocks } from "@/lib/actions/finnhub.actions";

export async function Header({ user }: { user: User }) {
  const initialStocks = await searchStocks();
  return (
    <div className="sticky top-0 header">
      <div className="container header-wrapper">
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
          <NavItems initialStocks={initialStocks} />
        </nav>

        <UserDropdown user={user} initialStocks={initialStocks} />
      </div>
    </div>
  );
};


export default Header