"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { LogOutIcon, UserIcon } from "lucide-react";
import { signOut } from "@/lib/actions/auth.actions";
import NavItems from "./NavItems";
import Link from "next/link";

const UserDropdown = ({
  user,
  initialStocks,
}: {
  user: User | null;
  initialStocks: StockWithWatchlistStatus[]
}) => {
  const router = useRouter();

  if (!user) {
    // Guests only ever see this inside the cream landing pill — ink-on-cream.
    return (
      <Link href="/sign-in">
        <Button
          variant="outline"
          className="h-9 rounded-full border-[rgba(23,19,14,0.12)] bg-white/70 px-6 text-[#17130e] transition-all duration-200 hover:bg-[#17130e] hover:text-[#faf7f2] active:scale-[0.97]"
        >
          Sign In
        </Button>
      </Link>
    );
  }

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-3 text-gray-400 hover:text-yellow-500"
        >
          <Avatar className="size-8 border border-zinc-800">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
              {user.name?.[0] || <UserIcon size={14} />}
            </AvatarFallback>
          </Avatar>

          <div className="hidden md:flex flex-col items-start">
            <span className="text-base font-medium text-gray-400">
              {user.name}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="text-gray-400 bg-zinc-900 border-zinc-800">
        <DropdownMenuLabel>
          <div className="relative flex items-center gap-3 py-2">
            <Avatar className="size-10 border border-zinc-800">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback className="bg-yellow-500 text-yellow-900 text-sm font-bold">
                {user.name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-col">
              <span className="text-base font-medium text-gray-400">
                {user.name}
              </span>
              <span className="text-sm text-gray-500">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-zinc-800" />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center gap-2 cursor-pointer focus:bg-red-500/10 focus:text-red-500"
        >
          <LogOutIcon className="size-4" />
          <span>Logout</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="hidden sm:block bg-zinc-800" />

        <div className="sm:hidden">
          <NavItems initialStocks={initialStocks} user={user} />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserDropdown;
