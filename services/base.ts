import { HttpClient, registerDefaultLogging } from "@/lib/http-client"
import { RateLimiter } from "@/lib/rate-limit"
import { withRetry, type RetryOptions } from "@/lib/retry"
import { APIError } from "@/lib/api-error"

export type ServiceConfig = {
  baseURL?: string
  rateLimit?: { maxPerInterval: number; intervalMs: number; key?: string }
  retry?: RetryOptions
  headers?: Record<string, string>
}

export abstract class BaseAPIService {
  protected client: HttpClient
  protected limiter?: RateLimiter
  protected retry?: RetryOptions
  protected rlKey: string

  constructor(cfg?: ServiceConfig) {
    this.client = new HttpClient(cfg?.baseURL)
    registerDefaultLogging(this.client)
    if (cfg?.rateLimit) {
      this.limiter = new RateLimiter(cfg.rateLimit.maxPerInterval, cfg.rateLimit.intervalMs)
      this.rlKey = cfg.rateLimit.key || "default"
    } else {
      this.rlKey = "default"
    }
    this.retry = cfg?.retry
  }

  protected async doRequest<T>(fn: () => Promise<T>): Promise<T> {
    const run = async () => {
      if (this.limiter) {
        await this.limiter.acquire(this.rlKey)
      }
      return await fn()
    }
    if (this.retry) {
      return withRetry(run, this.retry)
    }
    return run()
  }

  protected handleError(err: unknown): never {
    if (err instanceof APIError) {
      throw err
    }
    const message = err instanceof Error ? err.message : "Unknown error"
    throw new APIError(message)
  }
}
