import { RunwayErrorType, type RunwayError } from "@/types/runway-error"

function friendly(type: RunwayErrorType, code?: string) {
  switch (type) {
    case RunwayErrorType.AUTHENTICATION_ERROR:
      return {
        userMessage:
          "We couldn't authenticate with the video provider. This is usually due to a missing or expired API key.",
        suggestedAction: "Please contact support or an admin to update the provider keys.",
      }
    case RunwayErrorType.RATE_LIMIT_EXCEEDED:
      return {
        userMessage:
          "You're making requests faster than the provider allows. This is temporary and will clear shortly.",
        suggestedAction: "Wait a moment and retry, or let us automatically retry with backoff.",
      }
    case RunwayErrorType.QUOTA_EXCEEDED:
      return {
        userMessage: "You've reached your current plan's usage quota for video generation.",
        suggestedAction: "Try again tomorrow or upgrade your plan for higher limits.",
      }
    case RunwayErrorType.INVALID_PROMPT:
      return {
        userMessage:
          "The prompt was rejected or couldn't be processed. This can happen with disallowed content or formatting issues.",
        suggestedAction: "Adjust the prompt for clarity and policy compliance, then try again.",
      }
    case RunwayErrorType.TIMEOUT_ERROR:
      return {
        userMessage: "The request took too long to complete. This can happen under heavy load or on slow networks.",
        suggestedAction: "Retry in a bit or let us retry automatically.",
      }
    case RunwayErrorType.NETWORK_ERROR:
      return {
        userMessage: "We couldn't reach the video provider due to a network issue.",
        suggestedAction: "Check your connection. We'll queue your request offline or retry automatically.",
      }
    case RunwayErrorType.GENERATION_FAILED:
      return {
        userMessage: "The provider failed to generate the video due to a technical issue.",
        suggestedAction: "Retry, reduce quality or duration, or adjust the prompt.",
      }
    default:
      return {
        userMessage: "Something unexpected went wrong.",
        suggestedAction: "Retry or contact support if the problem persists.",
      }
  }
}

export function mapUnknownErrorToRunwayError(err: unknown): RunwayError {
  // Attempt to detect APIError shape
  const anyErr = err as any
  const status: number | undefined = anyErr?.status || anyErr?.response?.status
  const code: string | undefined = anyErr?.code || anyErr?.response?.data?.code
  const message: string = anyErr?.message || anyErr?.response?.data?.message || "Unexpected error"

  let type = RunwayErrorType.UNKNOWN_ERROR
  let retryable = false
  let retryAfterMs: number | undefined

  if (anyErr?.name === "AbortError") {
    type = RunwayErrorType.TIMEOUT_ERROR
    retryable = true
  } else if (status === 401 || status === 403) {
    type = RunwayErrorType.AUTHENTICATION_ERROR
    retryable = false
  } else if (status === 429) {
    const lc = (code || "").toLowerCase()
    if (lc.includes("quota")) {
      type = RunwayErrorType.QUOTA_EXCEEDED
      retryable = false
    } else {
      type = RunwayErrorType.RATE_LIMIT_EXCEEDED
      retryable = true
      // Default hint when Retry-After is unknown
      retryAfterMs = 30_000
    }
  } else if (status === 400 || status === 422) {
    type = RunwayErrorType.INVALID_PROMPT
    retryable = false
  } else if (status && [500, 502, 503, 504].includes(status)) {
    type = status === 504 ? RunwayErrorType.TIMEOUT_ERROR : RunwayErrorType.GENERATION_FAILED
    retryable = true
  } else if (anyErr instanceof TypeError) {
    // Often a fetch/network failure
    type = RunwayErrorType.NETWORK_ERROR
    retryable = true
  }

  // Merge in friendly text
  const { userMessage, suggestedAction } = friendly(type, code)
  return {
    type,
    message,
    userMessage,
    retryable,
    suggestedAction,
    retryAfterMs,
    status,
    code,
    details: anyErr?.details || anyErr?.response?.data,
  }
}
