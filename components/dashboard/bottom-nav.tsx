"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Film, LayoutDashboard, PlusCircle, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/create", label: "Create", icon: PlusCircle },
  { href: "/videos", label: "Videos", icon: Film },
  { href: "/analytics", label: "Insights", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0B0B0F]/95 backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid max-w-3xl grid-cols-5">
        {items.map((it) => {
          const active = pathname === it.href || pathname?.startsWith(it.href + "/")
          const Icon = it.icon
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2 text-xs transition",
                  active ? "text-white" : "text-white/70 hover:text-white",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className={cn("size-5", active ? "text-white" : "text-white/80")} />
                <span className="leading-none">{it.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
