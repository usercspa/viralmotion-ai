export enum RunwayErrorType {
  AUTHENTICATION_ERROR = "auth_error",
  RATE_LIMIT_EXCEEDED = "rate_limit",
  QUOTA_EXCEEDED = "quota_exceeded",
  INVALID_PROMPT = "invalid_prompt",
  GENERATION_FAILED = "generation_failed",
  NETWORK_ERROR = "network_error",
  TIMEOUT_ERROR = "timeout",
  UNKNOWN_ERROR = "unknown",
}

export interface RunwayError {
  type: RunwayErrorType
  message: string
  userMessage: string
  retryable: boolean
  suggestedAction: string
  retryAfterMs?: number
  code?: string
  status?: number
  details?: any
}
