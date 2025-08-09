type Tier = "free" | "pro" | "enterprise"

export type JobRecord = {
  job: {
    id: string
    status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED"
    progress?: number
    createdAt: string
    task: string
    output?: string[]
    failure?: string
    failureCode?: string
    etaMs?: number
    ratio?: "16:9" | "9:16" | "1:1"
    duration?: number
    metadata?: Record<string, any>
  }
  req: Record<string, any>
  ownerId: string
  lastPolledAt?: number
  nextPollAt?: number
  backoff?: { attempts: number; nextDelayMs: number }
  done?: boolean
}

type Usage = {
  seconds: number
  spendCents: number
  updatedAt: string
  tier: Tier
}

type Store = {
  jobs: Map<string, JobRecord>
  users: Map<string, Set<string>>
  pollLocks: Set<string>
  usage: Map<string, Usage>
}

let STORE: Store | null = null

export function getRunwayStore(): Store {
  if (!STORE) {
    STORE = {
      jobs: new Map(),
      users: new Map(),
      pollLocks: new Set(),
      usage: new Map(),
    }
  }
  return STORE
}

export function getUserTier(ownerId: string): Tier {
  const { usage } = getRunwayStore()
  const u = usage.get(ownerId)
  return u?.tier ?? "free"
}

export function setUserTier(ownerId: string, tier: Tier) {
  const { usage } = getRunwayStore()
  const now = new Date().toISOString()
  const current = usage.get(ownerId)
  usage.set(ownerId, {
    seconds: current?.seconds ?? 0,
    spendCents: current?.spendCents ?? 0,
    updatedAt: now,
    tier,
  })
}
