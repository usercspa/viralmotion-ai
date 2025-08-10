"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type Health = {
  status: "healthy" | "degraded" | "down"
  latencyMs?: number
  keyPool: { total: number; available: number; disabled: number; usage: any[] }
  errorRate: number
  notes?: string[]
}
type ErrorAnalytics = {
  errorRate: number
  commonErrors: string[]
  errorTrends: { t: number; type: string; count: number }[]
  userImpact: number
  recoveryRate: number
}

export default function StatusPage() {
  const [health, setHealth] = React.useState<Health | null>(null)
  const [analytics, setAnalytics] = React.useState<ErrorAnalytics | null>(null)

  React.useEffect(() => {
    async function load() {
      const [h, a] = await Promise.all([
        fetch("/api/health/runway", { cache: "no-store" }).then((r) => r.json()),
        fetch("/api/monitoring/errors", { cache: "no-store" }).then((r) => r.json()),
      ])
      setHealth(h)
      setAnalytics(a)
    }
    load()
    const id = setInterval(load, 20000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Runway Provider Health</CardTitle>
          {health ? (
            <Badge variant="outline" className="capitalize">
              {health.status}
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Metric label="Status" value={health?.status ?? "—"} />
          <Metric label="Latency" value={health?.latencyMs ? `${health.latencyMs} ms` : "—"} />
          <Metric label="Error Rate" value={health ? `${(health.errorRate * 100).toFixed(1)}%` : "—"} />
          <Metric
            label="Keys (available)"
            value={health ? `${health.keyPool.available}/${health.keyPool.total}` : "—"}
          />
          <Metric label="Keys disabled" value={health?.keyPool.disabled ?? "—"} />
          <Metric label="Notes" value={(health?.notes || ["—"]).join("  ")} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Error Analytics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Metric label="Recovery Rate" value={analytics ? `${Math.round(analytics.recoveryRate * 100)}%` : "—"} />
          <Metric label="User Impact (recent errors)" value={analytics?.userImpact ?? "—"} />
          <Metric label="Top Errors" value={(analytics?.commonErrors || []).join(", ") || "—"} />
        </CardContent>
        <CardContent>
          <div className="mt-2 text-xs text-white/70">
            Trends (last hour):{" "}
            {(analytics?.errorTrends || [])
              .slice(-10)
              .map((t) => `${new Date(t.t).toLocaleTimeString()} ${t.type}:${t.count}`)
              .join("  ")}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
      <div className="text-xs text-white/60">{label}</div>
      <div className="mt-1 text-lg font-medium">{value}</div>
    </div>
  )
}
