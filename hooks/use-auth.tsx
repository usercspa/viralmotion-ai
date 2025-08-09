"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

export type AuthUser = {
  id: string
  email: string
  name?: string
  company?: string
  role?: "founder" | "business_owner" | "marketing_manager"
}

const AuthContext = React.createContext<{
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (payload: {
    email: string
    password: string
    name?: string
    company?: string
    role?: AuthUser["role"]
  }) => Promise<void>
  signOut: () => void
  requestPasswordReset: (email: string) => Promise<void>
  updateProfile: (payload: Partial<Omit<AuthUser, "id">>) => Promise<void>
}>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: () => {},
  requestPasswordReset: async () => {},
  updateProfile: async () => {},
})

const STORAGE_KEY = "vvm:user"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [loading, setLoading] = React.useState(true)
  const router = useRouter()

  React.useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null
      if (raw) setUser(JSON.parse(raw))
    } catch {}
    setLoading(false)
  }, [])

  async function signIn(email: string, password: string) {
    await new Promise((r) => setTimeout(r, 700))
    if (!email || !password) throw new Error("Missing credentials")
    const u: AuthUser = { id: crypto.randomUUID(), email }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    setUser(u)
    router.push("/dashboard")
  }

  async function signUp(payload: {
    email: string
    password: string
    name?: string
    company?: string
    role?: AuthUser["role"]
  }) {
    await new Promise((r) => setTimeout(r, 900))
    if (!payload.email || !payload.password) throw new Error("Missing fields")
    const u: AuthUser = {
      id: crypto.randomUUID(),
      email: payload.email,
      name: payload.name,
      company: payload.company,
      role: payload.role,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    setUser(u)
    router.push("/dashboard")
  }

  function signOut() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
    router.push("/")
  }

  async function requestPasswordReset(email: string) {
    await new Promise((r) => setTimeout(r, 900))
    if (!/\S+@\S+\.\S+/.test(email)) throw new Error("Invalid email address")
    // In real app, call backend to send email.
    return
  }

  async function updateProfile(payload: Partial<Omit<AuthUser, "id">>) {
    // Simulate latency
    await new Promise((r) => setTimeout(r, 500))
    setUser((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...payload }
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      }
      return next
    })
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, requestPasswordReset, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return React.useContext(AuthContext)
}
