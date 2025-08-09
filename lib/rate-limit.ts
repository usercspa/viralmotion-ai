type Bucket = {
  timestamps: number[]
  lastPrune: number
}

export class RateLimiter {
  private max: number
  private intervalMs: number
  private buckets: Map<string, Bucket>

  constructor(maxPerInterval: number, intervalMs: number) {
    this.max = maxPerInterval
    this.intervalMs = intervalMs
    this.buckets = new Map()
  }

  private prune(key: string, now: number) {
    const bucket = this.buckets.get(key)
    if (!bucket) return
    if (now - bucket.lastPrune < 50) return
    bucket.timestamps = bucket.timestamps.filter((t) => now - t < this.intervalMs)
    bucket.lastPrune = now
  }

  async acquire(key: string): Promise<void> {
    const now = Date.now()
    if (!this.buckets.has(key)) {
      this.buckets.set(key, { timestamps: [], lastPrune: now })
    }
    // Busy-wait with sleeps until we have capacity
    // This is fine for low throughput server actions/route handlers.
    while (true) {
      const bucket = this.buckets.get(key)!
      this.prune(key, Date.now())
      if (bucket.timestamps.length < this.max) {
        bucket.timestamps.push(Date.now())
        return
      }
      const oldest = bucket.timestamps[0]
      const wait = Math.max(1, this.intervalMs - (Date.now() - oldest))
      await new Promise((r) => setTimeout(r, Math.min(wait, 250)))
    }
  }
}
