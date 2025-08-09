// Lightweight daily quota tracker (in-memory).
// For multi-instance deployments, back this with a shared store (e.g., Redis/KV).

export type QuotaResult = {
  allowed: boolean
  used: number
  remaining: number
  resetAt: number // epoch ms
}

export class DailyQuota {
  private maxPerDay: number
  private counts: Map<string, { dateKey: string; count: number }>

  constructor(maxPerDay: number) {
    this.maxPerDay = Math.max(1, maxPerDay)
    this.counts = new Map()
  }

  private getDateKey(): string {
    const now = new Date()
    return `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}`
  }

  checkAndIncrement(key: string): QuotaResult {
    const dateKey = this.getDateKey()
    const rec = this.counts.get(key)
    if (!rec || rec.dateKey !== dateKey) {
      this.counts.set(key, { dateKey, count: 0 })
    }
    const cur = this.counts.get(key)!
    const allowed = cur.count < this.maxPerDay
    if (allowed) cur.count++
    // Approximate midnight UTC reset
    const now = new Date()
    const reset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0))
    return {
      allowed,
      used: cur.count,
      remaining: Math.max(0, this.maxPerDay - cur.count),
      resetAt: reset.getTime(),
    }
  }
}
