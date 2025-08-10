import { getKeyPoolStats } from "@/lib/quota-tracker"
import { getErrorAnalytics } from "@/lib/error-analytics"

export type ProviderHealth = {
  status: "healthy" | "degraded" | "down"
  latencyMs?: number
  keyPool: ReturnType<typeof getKeyPoolStats>
  errorRate: number
  notes?: string[]
}

export async function checkRunwayHealth(): Promise<ProviderHealth> {
  const keyPool = getKeyPoolStats()
  const analytics = getErrorAnalytics()
  const notes: string[] = []

  let latencyMs: number | undefined
  try {
    const start = Date.now()
    // HEAD may not be allowed; fall back to GET inference path with no auth to check connectivity
    const res = await fetch("https://api.runwayml.com/v1", { method: "GET" })
    latencyMs = Date.now() - start
    if (!res.ok && res.status >= 500) notes.push(`Provider responded with ${res.status}`)
  } catch {
    notes.push("Network fetch failed")
  }

  let status: ProviderHealth["status"] = "healthy"
  if (analytics.errorRate > 0.1 || keyPool.available < Math.ceil(keyPool.total / 2) || (latencyMs || 0) > 1500) {
    status = "degraded"
  }
  if (keyPool.available === 0 || notes.includes("Network fetch failed")) {
    status = "down"
  }

  return { status, latencyMs, keyPool, errorRate: analytics.errorRate, notes }
}
