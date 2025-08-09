import { cookies } from "next/headers"

const COOKIE_NAME = "vvm_session_id"

export async function getOrCreateSessionId(): Promise<string> {
  const store = cookies()
  const existing = store.get(COOKIE_NAME)?.value
  if (existing) return existing
  const id = crypto.randomUUID()
  store.set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  })
  return id
}
