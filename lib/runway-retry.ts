import { RunwayErrorType, type RunwayError } from "@/types/runway-error"

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}

export class RunwayRetryHandler {
  constructor(
    private baseDelayMs = 1200,
    private maxDelayMs = 30_000,
  ) {}

  private nextDelay(attempt: number, override?: number) {
    if (typeof override === "number" && override > 0) {
      return Math.min(this.maxDelayMs, override)
    }
    const jitter = Math.floor(Math.random() * 200)
    return Math.min(this.maxDelayMs, Math.round(this.baseDelayMs * Math.pow(1.6, attempt)) + jitter)
  }

  // You can pass errorClassifier to refine mapping in the UI if you have richer error info.
  async executeWithRetry<T>(operation: () => Promise<T>, errorTypeHint?: RunwayErrorType, maxRetries = 3): Promise<T> {
    let attempt = 0
    while (true) {
      try {
        return await operation()
      } catch (e: any) {
        attempt++
        const err: RunwayError = this.normalize(e, errorTypeHint)
        // Only retry retryable classes
        if (!err.retryable || attempt > maxRetries) {
          throw err
        }
        const delayMs = this.nextDelay(attempt, err.retryAfterMs)
        await sleep(delayMs)
        continue
      }
    }
  }

  private normalize(e: any, hint?: RunwayErrorType): RunwayError {
    const type = hint || this.inferType(e)
    const retryable = [
      RunwayErrorType.RATE_LIMIT_EXCEEDED,
      RunwayErrorType.NETWORK_ERROR,
      RunwayErrorType.TIMEOUT_ERROR,
      RunwayErrorType.GENERATION_FAILED,
    ].includes(type)
    const retryAfterMs = type === RunwayErrorType.RATE_LIMIT_EXCEEDED ? e?.retryAfterMs || 30_000 : undefined

    return {
      type,
      message: e?.message || "Operation failed",
      userMessage: this.userMessage(type),
      suggestedAction: this.suggested(type),
      retryable,
      retryAfterMs,
      status: e?.status,
      code: e?.code,
      details: e?.details,
    }
  }

  private inferType(e: any): RunwayErrorType {
    const s = e?.status
    const c = (e?.code || "").toString().toLowerCase()
    if (e?.name === "AbortError" || s === 504) return RunwayErrorType.TIMEOUT_ERROR
    if (s === 401 || s === 403) return RunwayErrorType.AUTHENTICATION_ERROR
    if (s === 429) return c.includes("quota") ? RunwayErrorType.QUOTA_EXCEEDED : RunwayErrorType.RATE_LIMIT_EXCEEDED
    if (s === 400 || s === 422) return RunwayErrorType.INVALID_PROMPT
    if ([500, 502, 503].includes(s)) return RunwayErrorType.GENERATION_FAILED
    if (e instanceof TypeError) return RunwayErrorType.NETWORK_ERROR
    return RunwayErrorType.UNKNOWN_ERROR
  }

  private userMessage(t: RunwayErrorType) {
    switch (t) {
      case RunwayErrorType.AUTHENTICATION_ERROR:
        return "Provider authentication failed."
      case RunwayErrorType.RATE_LIMIT_EXCEEDED:
        return "Too many requests right now."
      case RunwayErrorType.QUOTA_EXCEEDED:
        return "Usage quota has been reached."
      case RunwayErrorType.INVALID_PROMPT:
        return "The prompt was rejected or invalid."
      case RunwayErrorType.TIMEOUT_ERROR:
        return "The request timed out."
      case RunwayErrorType.NETWORK_ERROR:
        return "Network error while contacting provider."
      case RunwayErrorType.GENERATION_FAILED:
        return "Video generation failed due to a provider issue."
      default:
        return "Unexpected error."
    }
  }

  private suggested(t: RunwayErrorType) {
    switch (t) {
      case RunwayErrorType.AUTHENTICATION_ERROR:
        return "Contact an administrator to update provider keys."
      case RunwayErrorType.RATE_LIMIT_EXCEEDED:
        return "Wait 30–60 seconds and try again."
      case RunwayErrorType.QUOTA_EXCEEDED:
        return "Try again tomorrow or upgrade your plan."
      case RunwayErrorType.INVALID_PROMPT:
        return "Revise the prompt to be clearer and policy compliant."
      case RunwayErrorType.TIMEOUT_ERROR:
        return "Retry in a bit or reduce complexity."
      case RunwayErrorType.NETWORK_ERROR:
        return "Check your internet connection and retry."
      case RunwayErrorType.GENERATION_FAILED:
        return "Retry with reduced quality or duration."
      default:
        return "Retry the operation."
    }
  }
}
