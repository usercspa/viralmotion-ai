import { NextResponse } from "next/server"
import { checkRunwayHealth } from "@/lib/network-health"

// Very simple SLA sampler: you would persist these points in a DB in production
let samples: { t: number; status: "healthy" | "degraded" | "down" }[] = []

export async function GET() {
  const health = await checkRunwayHealth()
  const now = Date.now()
  samples.push({ t: now, status: health.status })
  // prune last 24h
  const cutoff = now - 24 * 60 * 60 * 1000
  samples = samples.filter((s) => s.t >= cutoff)

  const total = samples.length || 1
  const up = samples.filter((s) => s.status !== "down").length
  const uptime = (up / total) * 100

  return NextResponse.json({ uptimePercent24h: Math.round(uptime * 100) / 100, samples })
}
