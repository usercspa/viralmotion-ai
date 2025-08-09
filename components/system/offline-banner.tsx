"use client"

import * as React from "react"
import { WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

export function OfflineBanner() {
  const [online, setOnline] = React.useState<boolean>(true)
  const [visible, setVisible] = React.useState<boolean>(false)

  React.useEffect(() => {
    const set = () => {
      const on = navigator.onLine
      setOnline(on)
      setVisible(!on)
    }
    set()
    const onOnline = () => {
      setOnline(true)
      setVisible(false)
    }
    const onOffline = () => {
      setOnline(false)
      setVisible(true)
    }
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)
    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
    }
  }, [])

  if (!visible) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/15 px-4 py-2 text-xs text-amber-200 backdrop-blur",
      )}
    >
      <WifiOff className="size-4" />
      <span>{"You're offline. Some actions will be unavailable until connection is restored."}</span>
    </div>
  )
}
