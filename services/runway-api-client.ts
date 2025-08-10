// Typed client for Runway ML with robust error mapping, retries, timeouts, and optional rate limiting.

import type { RateLimiter } from "@/lib/rate-limit"
import { APIError } from "@/lib/api-error"
import { getNextApiKey, setApiKeys, reportFailure, reportSuccess } from "@/lib/quota-tracker"

export class RunwayValidationError extends APIError {}
export class RunwayRateLimitedError extends APIError {}
export class RunwayQuotaExceededError extends APIError {}
export class RunwayUnavailableError extends APIError {}

export type RequestOptions = {
  method: "GET" | "POST" | "DELETE"
  body?: any
  headers?: Record<string, string>
  signal?: AbortSignal
  timeoutMs?: number
  retry?: { maxRetries?: number; baseDelayMs?: number }
}

export type ClientConfig = {
  baseURL?: string
  apiKey?: string
  rateLimiter?: RateLimiter
  getApiKey?: () => string
}

export class RunwayAPIClient {
  private baseURL = "https://api.runwayml.com/v1"
  private apiKey?: string
  private getApiKey?: () => string
  private rateLimiter?: RateLimiter

  constructor(cfg: ClientConfig) {
    if (cfg.baseURL) this.baseURL = cfg.baseURL
    this.apiKey = cfg.apiKey
    this.getApiKey = cfg.getApiKey
    this.rateLimiter = cfg.rateLimiter

    // Initialize key pool if RUNWAY_API_KEYS provided
    if (!this.apiKey && !this.getApiKey) {
      const keysCsv = process.env.RUNWAY_API_KEYS || process.env.RUNWAY_API_KEY || ""
      const keys = keysCsv
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean)
      if (keys.length === 0) {
        throw new APIError("RUNWAY_API_KEY(S) not configured", { status: 500, code: "NO_RUNWAY_KEYS" })
      }
      setApiKeys(keys)
      this.getApiKey = getNextApiKey
    }
  }

  async makeRequest<T>(endpoint: string, options: RequestOptions): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    }

    const key = this.getApiKey ? this.getApiKey() : this.apiKey
    if (!key) throw new APIError("Runway API key missing", { status: 500 })
    headers.Authorization = `Bearer ${key}`

    if (this.rateLimiter) {
      await this.rateLimiter.removeTokens(1)
    }

    const timeoutMs = options.timeoutMs ?? 60_000
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    const signal = options.signal || controller.signal

    const maxRetries = options.retry?.maxRetries ?? 3
    const baseDelay = options.retry?.baseDelayMs ?? 1200

    let attempt = 0
    while (true) {
      try {
        const res = await fetch(url, {
          method: options.method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal,
        })
        clearTimeout(timeout)
        if (res.ok) {
          reportSuccess(key)
          const ct = res.headers.get("content-type") || ""
          if (ct.includes("application/json")) return (await res.json()) as T
          return {} as unknown as T
        }
        const data = await safeJson(res)
        const mapped = this.mapError(res.status, data)
        const retryAfterHeader = res.headers.get("retry-after")
        let retryAfterMs: number | undefined = undefined
        if (retryAfterHeader) {
          const sec = Number(retryAfterHeader)
          if (!isNaN(sec)) retryAfterMs = sec * 1000
        }
        reportFailure(key, res.status, data?.error?.code || data?.code, retryAfterMs)
        if (this.shouldRetry(res.status, data) && attempt < maxRetries) {
          attempt++
          await delay(this.computeDelay(baseDelay, attempt, retryAfterHeader))
          continue
        }
        throw mapped
      } catch (err: any) {
        if (err?.name === "AbortError") {
          reportFailure(key, 504, "timeout")
          if (attempt < maxRetries) {
            attempt++
            await delay(this.computeDelay(baseDelay, attempt))
            continue
          }
          throw new RunwayUnavailableError("Request timed out", { status: 504 })
        }
        // Network error?
        reportFailure(key, 503, "network")
        if (attempt < maxRetries) {
          attempt++
          await delay(this.computeDelay(baseDelay, attempt))
          continue
        }
        throw err instanceof APIError ? err : new RunwayUnavailableError("Network error", { status: 503 })
      }
    }
  }

  async createVideoGeneration(body: Record<string, any>) {
    return await this.makeRequest<{ id: string; status: string; estimated_time?: number; created_at?: string }>(
      "/inference",
      { method: "POST", body },
    )
  }

  async getJobStatus(jobId: string) {
    return await this.makeRequest<{
      id: string
      status: string
      progress?: number
      created_at?: string
      output?: string[]
      error?: { message?: string; code?: string }
    }>(`/inference/${encodeURIComponent(jobId)}`, { method: "GET" })
  }

  async cancelJob(jobId: string) {
    return await this.makeRequest<{
      id: string
      status: string
      progress?: number
      created_at?: string
      output?: string[]
      error?: { message?: string; code?: string }
    }>(`/inference/${encodeURIComponent(jobId)}/cancel`, { method: "POST", body: {} })
  }

  private shouldRetry(status: number, body: any) {
    if ([408, 500, 502, 503, 504].includes(status)) return true
    if (status === 429) {
      const code = (body?.code || body?.error?.code || "").toLowerCase()
      if (code.includes("quota")) return false
      return true
    }
    return false
  }

  private computeDelay(base: number, attempt: number, retryAfterHeader?: string | null) {
    if (retryAfterHeader) {
      const sec = Number(retryAfterHeader)
      if (!isNaN(sec)) return sec * 1000
    }
    const jitter = Math.floor(Math.random() * 200)
    return Math.min(30_000, Math.round(base * Math.pow(1.5, attempt)) + jitter)
  }

  private mapError(status: number, body: any): APIError {
    const message = body?.error?.message || body?.message || `Runway error ${status}`
    const code = body?.error?.code || body?.code
    if (status === 400) return new RunwayValidationError(message, { status, code })
    if (status === 401 || status === 403) return new APIError("Unauthorized", { status, code })
    if (status === 404) return new APIError("Not found", { status, code })
    if (status === 409) return new APIError(message, { status, code })
    if (status === 422) return new RunwayValidationError(message, { status, code })
    if (status === 429) {
      const c = (code || "").toLowerCase()
      if (c.includes("quota")) return new RunwayQuotaExceededError("Quota exceeded", { status, code })
      return new RunwayRateLimitedError("Rate limited", { status, code })
    }
    if ([500, 502, 503, 504].includes(status)) return new RunwayUnavailableError(message, { status, code })
    return new APIError(message, { status, code })
  }
}

async function safeJson(res: Response) {
  try {
    return await res.json()
  } catch {
    return {}
  }
}

function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}
