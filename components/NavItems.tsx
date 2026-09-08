"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Menu } from "lucide-react";

import { NAV_ITEMS, TOOLS_ITEMS } from "@/lib/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import SearchCommand from "./SearchCommand";

const linkClass = (active: boolean) =>
  cn(
    "app-focus rounded-md text-sm transition-colors duration-150 ease-out-strong",
    active ? "text-ink font-medium" : "text-ink-secondary",
    "hover:text-ink"
  );

const menuContentClass =
  "border-hairline bg-surface-overlay text-ink-secondary app-shadow-2";
const menuItemClass =
  "cursor-pointer text-ink-secondary focus:bg-surface-raised-2 focus:text-brand";

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

  // Guests see only the logo and Sign In (handled in Header/UserDropdown).
  if (!user) return null;

  const toolsActive = isActive("/tools");

  return (
    <>
      {/* Desktop / tablet — one horizontal rail. */}
      <ul className="hidden items-center gap-6 sm:flex lg:gap-7">
        {NAV_ITEMS.map(({ href, label }) => {
          if (href === "/search")
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
                    className={cn(
                      linkClass(toolsActive),
                      "flex items-center gap-1 outline-none"
                    )}
                  >
                    {label}
                    <ChevronDown className="size-4" aria-hidden />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className={cn(menuContentClass, "w-64")}
                  >
                    {TOOLS_ITEMS.map((tool) => (
                      <DropdownMenuItem
                        key={tool.href}
                        asChild
                        className={menuItemClass}
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
              <Link href={href} className={linkClass(isActive(href))}>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Mobile — the same map, collapsed into one menu. */}
      <div className="flex items-center gap-1 sm:hidden">
        <SearchCommand
          renderAs="text"
          label="Search"
          initialStocks={initialStocks}
        />
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Open navigation menu"
            className="app-press app-focus flex size-9 items-center justify-center rounded-md border border-hairline text-ink-secondary outline-none"
          >
            <Menu className="size-4" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className={cn(menuContentClass, "w-56")}
          >
            {NAV_ITEMS.filter((item) => item.href !== "/search").map(
              ({ href, label }) =>
                href === "/tools" ? null : (
                  <DropdownMenuItem key={href} asChild className={menuItemClass}>
                    <Link
                      href={href}
                      className={isActive(href) ? "text-ink" : undefined}
                    >
                      {label}
                    </Link>
                  </DropdownMenuItem>
                )
            )}
            <DropdownMenuSeparator className="bg-[var(--app-hairline)]" />
            <DropdownMenuLabel className="app-label">Tools</DropdownMenuLabel>
            {TOOLS_ITEMS.map((tool) => (
              <DropdownMenuItem key={tool.href} asChild className={menuItemClass}>
                <Link href={tool.href}>{tool.label}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
};

export default NavItems;
