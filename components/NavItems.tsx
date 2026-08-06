"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

import { NAV_ITEMS, TOOLS_ITEMS } from "@/lib/constants";
import SearchCommand from "./SearchCommand";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

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

        if (href === "/tools")
          return (
            <li key={href}>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={`flex items-center gap-1 outline-none hover:text-yellow-500 transition-colors ${
                    isActive(href) ? "text-gray-100" : ""
                  }`}
                >
                  {label}
                  <ChevronDown className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="text-gray-400 bg-zinc-900 border-zinc-800"
                >
                  {TOOLS_ITEMS.map((tool) => (
                    <DropdownMenuItem
                      key={tool.href}
                      asChild
                      className="cursor-pointer focus:bg-zinc-800 focus:text-yellow-500"
                    >
                      <Link href={tool.href}>{tool.label}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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