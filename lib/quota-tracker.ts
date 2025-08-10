// Key pool with automatic failover, cooldowns, usage tracking, and simple quota hints.

type KeyInfo = {
  key: string
  disabledUntil: number
  failures: number
  successes: number
  lastUsed: number
  usageCount: number
}

const pool: KeyInfo[] = []
let cursor = 0

export function setApiKeys(keys: string[]) {
  pool.length = 0
  const now = Date.now()
  for (const k of keys) {
    pool.push({
      key: k,
      disabledUntil: 0,
      failures: 0,
      successes: 0,
      lastUsed: now - Math.floor(Math.random() * 1000),
      usageCount: 0,
    })
  }
  cursor = 0
}

function findNextAvailable(): number | null {
  if (pool.length === 0) return null
  const now = Date.now()
  // Prefer least recently used that is not disabled
  const candidates = pool
    .map((p, idx) => ({ idx, p }))
    .filter(({ p }) => p.disabledUntil <= now)
    .sort((a, b) => a.p.lastUsed - b.p.lastUsed)
  if (candidates.length > 0) return candidates[0].idx
  // All disabled; pick the one that becomes available soonest
  const soonest = pool.map((p, idx) => ({ idx, until: p.disabledUntil })).sort((a, b) => a.until - b.until)[0]
  return soonest ? soonest.idx : 0
}

export function getNextApiKey(): string {
  const idx = findNextAvailable()
  if (idx == null) throw new Error("No API keys configured")
  cursor = idx
  const info = pool[idx]
  info.lastUsed = Date.now()
  info.usageCount += 1
  return info.key
}

export function reportSuccess(key: string) {
  const info = pool.find((p) => p.key === key)
  if (!info) return
  info.successes += 1
  // On success, clear any soft-disable
  if (info.disabledUntil > 0 && info.disabledUntil < Date.now()) {
    info.disabledUntil = 0
  }
}

export function reportFailure(key: string, status?: number, code?: string, retryAfterMs?: number) {
  const info = pool.find((p) => p.key === key)
  if (!info) return
  info.failures += 1
  const now = Date.now()

  if (status === 401 || status === 403) {
    // Hard auth error: disable for 24h
    info.disabledUntil = now + 24 * 60 * 60 * 1000
  } else if (status === 429) {
    // Rate limit: short cooldown or server-provided retry-after
    const cooldown = typeof retryAfterMs === "number" ? retryAfterMs : 45_000
    info.disabledUntil = Math.max(info.disabledUntil, now + cooldown)
  } else if (status && [500, 502, 503, 504].includes(status)) {
    // Transient service errors: brief cooldown to distribute load
    info.disabledUntil = Math.max(info.disabledUntil, now + 15_000)
  } else {
    // Unknown: small cooldown to avoid thrash
    info.disabledUntil = Math.max(info.disabledUntil, now + 5_000)
  }
}

export function getKeyPoolStats() {
  const total = pool.length
  const now = Date.now()
  const available = pool.filter((p) => p.disabledUntil <= now).length
  const disabled = total - available
  const usage = pool.map((p) => ({
    key: anonymize(p.key),
    failures: p.failures,
    successes: p.successes,
    usageCount: p.usageCount,
    disabledForMs: Math.max(0, p.disabledUntil - now),
  }))
  return { total, available, disabled, usage }
}

export function estimateQuotaRisk() {
  // Very rough heuristic: if more than half keys are disabled or failure rate > success rate in last window
  const stats = getKeyPoolStats()
  const highDisabled = stats.available <= Math.ceil(stats.total / 2)
  const highFailures =
    stats.usage.reduce((a, b) => a + b.failures, 0) > stats.usage.reduce((a, b) => a + b.successes, 0)
  return { atRisk: highDisabled || highFailures, stats }
}

function anonymize(key: string) {
  if (key.length < 8) return "****"
  return `${key.slice(0, 3)}…${key.slice(-3)}`
}
