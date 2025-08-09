import { APIError } from "@/lib/api-error"

type Meta = { status?: number; code?: string; details?: any }

export class RunwayValidationError extends APIError {
  constructor(message = "Invalid Runway request", meta: Meta = {}) {
    super(message, { status: meta.status ?? 400, code: meta.code ?? "RUNWAY_VALIDATION", details: meta.details })
    this.name = "RunwayValidationError"
  }
}

export class RunwayRateLimitedError extends APIError {
  constructor(message = "Runway rate limit exceeded", meta: Meta = {}) {
    super(message, { status: meta.status ?? 429, code: meta.code ?? "RUNWAY_RATE_LIMITED", details: meta.details })
    this.name = "RunwayRateLimitedError"
  }
}

export class RunwayQuotaExceededError extends APIError {
  constructor(message = "Runway quota exceeded", meta: Meta = {}) {
    super(message, { status: meta.status ?? 429, code: meta.code ?? "RUNWAY_QUOTA_EXCEEDED", details: meta.details })
    this.name = "RunwayQuotaExceededError"
  }
}

export class RunwayUnavailableError extends APIError {
  constructor(message = "Runway service unavailable", meta: Meta = {}) {
    super(message, { status: meta.status ?? 503, code: meta.code ?? "RUNWAY_UNAVAILABLE", details: meta.details })
    this.name = "RunwayUnavailableError"
  }
}

export class RunwayAuthError extends APIError {
  constructor(message = "Runway authentication failed", meta: Meta = {}) {
    super(message, { status: meta.status ?? 401, code: meta.code ?? "RUNWAY_AUTH", details: meta.details })
    this.name = "RunwayAuthError"
  }
}

export function mapRunwayHttpError(status: number, body?: any): APIError {
  const msg = body?.error?.message || body?.message || `Runway HTTP ${status}`
  if (status === 401 || status === 403) return new RunwayAuthError(msg, { status })
  if (status === 429) {
    // Distinguish between per-second RL and quota if possible
    const code = (body?.error?.code || "").toString().toLowerCase()
    if (code.includes("quota")) return new RunwayQuotaExceededError(msg, { status })
    return new RunwayRateLimitedError(msg, { status })
  }
  if (status >= 500) return new RunwayUnavailableError(msg, { status })
  if (status >= 400) return new RunwayValidationError(msg, { status, details: body })
  return new APIError(msg, { status })
}
