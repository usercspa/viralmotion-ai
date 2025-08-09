"use client"

import { Bell, ChevronDown, Sparkles } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"

export function TopNav() {
  const { user, signOut } = useAuth()
  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("") ||
    user?.email?.slice(0, 2).toUpperCase() ||
    "U"

  return (
    <header className="flex h-14 items-center gap-2 border-b bg-background px-3 md:px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="ml-1 flex items-center gap-2 text-sm text-muted-foreground">
        <div className="flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-indigo-600">
          <Sparkles className="size-3.5 text-white" />
        </div>
        <span className="hidden text-foreground/80 sm:inline">Dashboard</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-4" />
          <span className="sr-only">Notifications</span>
          <span className="absolute right-1 top-1 inline-flex size-2 rounded-full bg-violet-500" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Avatar className="size-7">
                <AvatarImage src="/avatar-maya.png" alt="User avatar" />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm sm:block">{user?.name || user?.email}</span>
              <ChevronDown className="hidden size-4 sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <a href="/settings">Settings</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/analytics">Analytics</a>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
