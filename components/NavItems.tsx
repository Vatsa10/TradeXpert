"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

import { NAV_ITEMS } from "@/lib/constants";
import SearchCommand from "./SearchCommand";

const NavItems = ({
  initialStocks,
  user,
}: {
  initialStocks: StockWithWatchlistStatus[];
  user: User | null;
}) => {
  const pathname = usePathname();

  function isActive(path: string) {
    if (path === "/") return pathname === path;

    return pathname.startsWith(path);
  }

  // For guests on the landing page, we hide all nav items except the Logo and Sign In (handled in Header/UserDropdown)
  if (!user) return null;

  const visibleItems = NAV_ITEMS;

  return (
    <ul className="flex flex-col sm:flex-row p-2 gap-3 sm:gap-10 font-medium">
      {visibleItems.map(({ href, label }) => {
        if(href === '/search')
          return (
            <li key="search-trigger">
              <SearchCommand
                renderAs="text"
                label="Search"
                initialStocks={initialStocks}
              />
            </li>
          );

        return (
          <li key={href}>
            <Link
              href={href}
              className={`hover:text-yellow-500 transition-colors ${
                isActive(href) ? "text-gray-100" : ""
              }`}
            >
              {href === "/" && !user ? "Home" : label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
};

export default NavItems;