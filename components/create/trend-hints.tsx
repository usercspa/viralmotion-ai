"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"

type Trend = { topic: string; growth: number }

export function TrendHints({ onInsert }: { onInsert: (text: string) => void }) {
  const [loading, setLoading] = React.useState(true)
  const [trends, setTrends] = React.useState<Trend[]>([])

  React.useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await fetch("/api/trends")
        const data = (await res.json()) as { topics: Trend[] }
        if (!active) return
        setTrends(data.topics || [])
      } catch {
        // ignore
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="flex min-h-[28px] flex-wrap items-center gap-1">
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-white/60" /> : null}
      {trends.map((t) => (
        <button
          key={t.topic}
          type="button"
          onClick={() => onInsert(`#${t.topic}`)}
          className="transition-opacity hover:opacity-90"
          aria-label={`Insert trending topic ${t.topic}`}
        >
          <Badge variant="secondary" className="cursor-pointer">
            #{t.topic} ↑{t.growth}%
          </Badge>
        </button>
      ))}
    </div>
  )
}
