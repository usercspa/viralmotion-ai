import type { RunwayErrorType, RunwayError } from "@/types/runway-error"

export type TimeSeriesData = { t: number; type: RunwayErrorType; count: number }
export interface ErrorAnalytics {
  errorRate: number
  commonErrors: RunwayErrorType[]
  errorTrends: TimeSeriesData[]
  userImpact: number
  recoveryRate: number
}

type Bucket = {
  ts: number
  total: number
  errors: Map<RunwayErrorType, number>
  recoveries: number
}

const WINDOW_MS = 60 * 60 * 1000 // 1h rolling
const BUCKET_MS = 60 * 1000 // 1 min

let totalRequests = 0
let totalErrors = 0
let totalRecoveries = 0

const buckets: Map<number, Bucket> = new Map()

export function recordRequest() {
  totalRequests += 1
}

export function recordError(ownerId: string | null, err: RunwayError) {
  totalErrors += 1
  const b = getBucket(Date.now())
  b.total += 1
  b.errors.set(err.type, (b.errors.get(err.type) || 0) + 1)
}

export function recordRecovery() {
  totalRecoveries += 1
  const b = getBucket(Date.now())
  b.recoveries += 1
}

export function getErrorAnalytics(): ErrorAnalytics {
  prune()
  const trends: TimeSeriesData[] = []
  // Flatten buckets
  const typeTotals = new Map<RunwayErrorType, number>()
  for (const b of buckets.values()) {
    for (const [type, count] of b.errors.entries()) {
      trends.push({ t: b.ts, type, count })
      typeTotals.set(type, (typeTotals.get(type) || 0) + count)
    }
  }
  const common = Array.from(typeTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type]) => type)

  const requests = Math.max(1, totalRequests)
  const errorRate = totalErrors / requests
  const recoveryRate = totalRecoveries / Math.max(1, totalErrors)
  // User impact heuristic: error rate weighted by last-10 buckets
  const lastTen = Array.from(buckets.values())
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 10)
  const recentErr = lastTen.reduce((s, b) => s + sumMap(b.errors), 0)
  const userImpact = recentErr

  return { errorRate, commonErrors: common, errorTrends: trends, userImpact, recoveryRate }
}

function getBucket(now: number): Bucket {
  const ts = now - (now % BUCKET_MS)
  let b = buckets.get(ts)
  if (!b) {
    b = { ts, total: 0, errors: new Map(), recoveries: 0 }
    buckets.set(ts, b)
  }
  return b
}

function prune() {
  const cutoff = Date.now() - WINDOW_MS
  for (const [ts] of buckets) {
    if (ts < cutoff) buckets.delete(ts)
  }
}

function sumMap(m: Map<any, number>) {
  let s = 0
  for (const v of m.values()) s += v
  return s
}
