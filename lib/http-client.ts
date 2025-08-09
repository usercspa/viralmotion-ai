import { APIError } from "./api-error"

export type RequestInterceptor = (ctx: { url: string; init: RequestInit }) => Promise<void> | void
export type ResponseInterceptor = (ctx: {
  url: string
  init: RequestInit
  response: Response
  startedAt: number
  endedAt: number
}) => Promise<void> | void

export class HttpClient {
  private baseURL?: string
  private reqInterceptors: RequestInterceptor[] = []
  private resInterceptors: ResponseInterceptor[] = []

  constructor(baseURL?: string) {
    this.baseURL = baseURL?.replace(/\/+$/, "")
  }

  addRequestInterceptor(fn: RequestInterceptor) {
    this.reqInterceptors.push(fn)
  }

  addResponseInterceptor(fn: ResponseInterceptor) {
    this.resInterceptors.push(fn)
  }

  private buildUrl(path: string) {
    if (!this.baseURL) return path
    const p = path.startsWith("/") ? path : `/${path}`
    return `${this.baseURL}${p}`
  }

  async request<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
    const url = this.buildUrl(path)
    const ctx = { url, init }
    for (const i of this.reqInterceptors) {
      await i(ctx)
    }
    const startedAt = Date.now()
    const res = await fetch(ctx.url, ctx.init)
    const endedAt = Date.now()
    for (const i of this.resInterceptors) {
      await i({ url: ctx.url, init: ctx.init, response: res, startedAt, endedAt })
    }
    if (!res.ok) {
      throw await APIError.fromResponse(res)
    }
    const ct = res.headers.get("content-type") || ""
    if (ct.includes("application/json")) {
      return (await res.json()) as T
    }
    // Fallback to text
    return (await res.text()) as unknown as T
  }

  get<T = unknown>(path: string, init?: RequestInit) {
    return this.request<T>(path, { ...(init || {}), method: "GET" })
  }

  postJson<T = unknown>(path: string, body: unknown, init?: RequestInit) {
    const headers = new Headers(init?.headers)
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json")
    return this.request<T>(path, {
      ...(init || {}),
      method: "POST",
      headers,
      body: JSON.stringify(body),
    })
  }

  delete<T = unknown>(path: string, init?: RequestInit) {
    return this.request<T>(path, { ...(init || {}), method: "DELETE" })
  }
}

// Default simple logging
export function registerDefaultLogging(client: HttpClient) {
  client.addRequestInterceptor(({ url, init }) => {
    ;(init.headers as Headers | undefined)?.set?.("x-request-start", Date.now().toString())
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[HTTP] ->", init.method || "GET", url)
    }
  })
  client.addResponseInterceptor(({ url, response, startedAt, endedAt }) => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[HTTP] <-", response.status, response.statusText, url, `${endedAt - startedAt}ms`)
    }
  })
}
