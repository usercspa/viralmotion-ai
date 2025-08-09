"use client"

import { cn } from "@/lib/utils"

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-label="Loading"
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-transparent border-t-foreground/70 align-[-0.125em]",
        className,
      )}
      role="status"
    />
  )
}
