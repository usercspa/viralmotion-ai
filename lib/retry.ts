export type RetryOptions = {
  retries?: number
  baseDelayMs?: number
  factor?: number
  jitter?: boolean
  // Return true to retry on this error
  shouldRetry?: (error: unknown) => boolean
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const retries = opts.retries ?? 3
  const base = opts.baseDelayMs ?? 500
  const factor = opts.factor ?? 2
  const jitter = opts.jitter ?? true

  let attempt = 0
  let delay = base

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn()
    } catch (err) {
      attempt++
      const should = typeof opts.shouldRetry === "function" ? opts.shouldRetry(err) : defaultShouldRetry(err)
      if (!should || attempt > retries) {
        throw err
      }
      let wait = delay
      if (jitter) {
        const rand = Math.random() + 0.5 // 0.5 - 1.5
        wait = Math.round(wait * rand)
      }
      await sleep(wait)
      delay = delay * factor
    }
  }
}

function defaultShouldRetry(err: unknown) {
  // Retry network errors and 429/5xx
  if (typeof err === "object" && err && "status" in err) {
    const status = (err as any).status as number | undefined
    if (!status) return true // network-like
    if (status === 429) return true
    if (status >= 500) return true
    return false
  }
  return true
}
