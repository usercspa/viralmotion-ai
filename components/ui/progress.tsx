"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(({ className, value = 0, ...props }, ref) => {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      ref={ref}
      className={cn("relative h-2 w-full overflow-hidden rounded bg-white/10", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      {...props}
    >
      <div
        className="h-full w-full origin-left rounded bg-gradient-to-r from-fuchsia-500 to-indigo-500"
        style={{ transform: `scaleX(${clamped / 100})` }}
      />
    </div>
  )
})
Progress.displayName = "Progress"
