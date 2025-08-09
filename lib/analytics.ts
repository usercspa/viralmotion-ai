// Simple in-memory analytics for jobs and users.
// Replace with DB-backed metrics in production.

type Bucket = {
  count: number
  totalMs: number
  successes: number
  failures: number
  failureCodes: Record<string, number>
  costsCents: number
}

const USER_STATS = new Map<string, Bucket>()
const GLOBAL_STATS: Bucket = {
  count: 0,
  totalMs: 0,
  successes: 0,
  failures: 0,
  failureCodes: {},
  costsCents: 0,
}

export function recordJobCreated(ownerId: string) {
  const b = USER_STATS.get(ownerId) ?? {
    count: 0,
    totalMs: 0,
    successes: 0,
    failures: 0,
    failureCodes: {},
    costsCents: 0,
  }
  b.count += 1
  USER_STATS.set(ownerId, b)
  GLOBAL_STATS.count += 1
}

export function recordJobCost(ownerId: string, cents: number) {
  const b = USER_STATS.get(ownerId)
  if (b) b.costsCents += cents
  GLOBAL_STATS.costsCents += cents
}

export function recordJobCompleted(ownerId: string, elapsedMs: number, success: boolean, failureCode?: string) {
  const b = USER_STATS.get(ownerId)
  if (!b) return
  b.totalMs += elapsedMs
  if (success) b.successes += 1
  else {
    b.failures += 1
    if (failureCode) b.failureCodes[failureCode] = (b.failureCodes[failureCode] || 0) + 1
  }
  GLOBAL_STATS.totalMs += elapsedMs
  if (success) GLOBAL_STATS.successes += 1
  else {
    GLOBAL_STATS.failures += 1
    if (failureCode) GLOBAL_STATS.failureCodes[failureCode] = (GLOBAL_STATS.failureCodes[failureCode] || 0) + 1
  }
}

export function getUserAnalytics(ownerId: string) {
  const b = USER_STATS.get(ownerId) ?? {
    count: 0,
    totalMs: 0,
    successes: 0,
    failures: 0,
    failureCodes: {},
    costsCents: 0,
  }
  const avgMs = b.successes > 0 ? Math.round(b.totalMs / (b.successes + b.failures || 1)) : 120_000
  const successRate = b.count > 0 ? Math.round((b.successes / b.count) * 100) : 100
  return {
    totalJobs: b.count,
    averageGenerationTimeMs: avgMs,
    successRate,
    failuresByCode: b.failureCodes,
    totalCostCents: b.costsCents,
  }
}

export function getGlobalAnalytics() {
  const avgMs =
    GLOBAL_STATS.successes + GLOBAL_STATS.failures > 0
      ? Math.round(GLOBAL_STATS.totalMs / (GLOBAL_STATS.successes + GLOBAL_STATS.failures))
      : 120_000
  const successRate = GLOBAL_STATS.count > 0 ? Math.round((GLOBAL_STATS.successes / GLOBAL_STATS.count) * 100) : 100
  return {
    totalJobs: GLOBAL_STATS.count,
    averageGenerationTimeMs: avgMs,
    successRate,
    failuresByCode: GLOBAL_STATS.failureCodes,
    totalCostCents: GLOBAL_STATS.costsCents,
  }
}
