"use client"

import * as React from "react"
import { AlertTriangle, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

type Health = {
  status: "healthy" | "degraded" | "down"
  latencyMs?: number
  errorRate: number
  notes?: string[]
}

export function StatusBanner({ className }: { className?: string }) {
  const [health, setHealth] = React.useState<Health | null>(null)

  React.useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch("/api/health/runway", { cache: "no-store" })
        const h = (await res.json()) as Health
        if (mounted) setHealth(h)
      } catch {
        if (mounted) setHealth({ status: "down", errorRate: 1 })
      }
    }
    load()
    const id = setInterval(load, 15000)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])

  if (!health || health.status === "healthy") return null
  const color =
    health.status === "degraded"
      ? "bg-amber-500/10 border-amber-400/30 text-amber-100"
      : "bg-rose-500/10 border-rose-400/30 text-rose-100"
  const Icon = health.status === "degraded" ? Activity : AlertTriangle

  return (
    <div className={cn("w-full border-b px-3 py-2 text-sm", color, className)}>
      <div className="mx-auto flex max-w-6xl items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="font-medium capitalize">{health.status}:</span>
        <span>
          Runway service is currently {health.status}. {health.latencyMs ? `Latency ${health.latencyMs} ms. ` : ""}
          {health.errorRate > 0 ? `Recent error rate ${(health.errorRate * 100).toFixed(1)}%. ` : ""}
          {health.notes?.[0] ? health.notes[0] : "We’re monitoring and will retry automatically."}
        </span>
      </div>
    </div>
  )
}
