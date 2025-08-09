export type APIErrorPayload = {
  message: string
  status?: number
  code?: string
  details?: unknown
}

export class APIError extends Error {
  status?: number
  code?: string
  details?: unknown

  constructor(message: string, init?: { status?: number; code?: string; details?: unknown }) {
    super(message)
    this.name = "APIError"
    this.status = init?.status
    this.code = init?.code
    this.details = init?.details
  }

  static fromResponse = async (res: Response): Promise<APIError> => {
    let details: any = undefined
    try {
      const ct = res.headers.get("content-type") || ""
      if (ct.includes("application/json")) {
        details = await res.json()
      } else {
        details = await res.text()
      }
    } catch {
      // ignore parse errors
    }
    const message =
      (details && (details.error?.message || details.message)) ||
      `Request failed with status ${res.status} ${res.statusText}`
    return new APIError(message, { status: res.status, code: (details && details.code) || undefined, details })
  }
}
