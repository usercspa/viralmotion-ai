// In-memory job persistence for Runway jobs keyed by user session.
// Replace with a shared store (KV/DB) for horizontal scaling.

import type { BackoffState } from "./backoff"

export type JobStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED"

export type StoredJob = {
  id: string
  status: JobStatus
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

export type StoredRequest = {
  taskType: "gen3" | "gen2" | "text-to-video"
  promptText: string
  duration?: number
  ratio?: "16:9" | "9:16" | "1:1"
  seed?: number
  watermark?: boolean
  exploreMode?: boolean
  negativePrompt?: string
  providerPayload?: Record<string, any>
}

export type JobRecord = {
  job: StoredJob
  req: StoredRequest
  ownerId: string
  lastPolledAt?: number
  nextPollAt?: number
  backoff?: BackoffState
  done?: boolean
  timeoutAt?: number
  createdAtMs: number
  // Analytics fields
  startedAtMs?: number
  completedAtMs?: number
  retries?: number
}

type Store = {
  jobs: Map<string, JobRecord>
  users: Map<string, Set<string>>
  pollLocks: Set<string>
}

let STORE: Store | null = null

export function getJobStore(): Store {
  if (!STORE) {
    STORE = {
      jobs: new Map(),
      users: new Map(),
      pollLocks: new Set(),
    }
  }
  return STORE
}

// Helpers

export function linkJobToUser(ownerId: string, jobId: string) {
  const store = getJobStore()
  if (!store.users.has(ownerId)) store.users.set(ownerId, new Set())
  store.users.get(ownerId)!.add(jobId)
}

export function listUserJobs(ownerId: string) {
  const store = getJobStore()
  const ids = store.users.get(ownerId) || new Set<string>()
  const items: JobRecord[] = []
  ids.forEach((id) => {
    const rec = store.jobs.get(id)
    if (rec) items.push(rec)
  })
  return items
}

export function upsertJob(rec: JobRecord) {
  getJobStore().jobs.set(rec.job.id, rec)
}

export function getJob(jobId: string) {
  return getJobStore().jobs.get(jobId)
}

export function deleteJob(jobId: string) {
  const store = getJobStore()
  const rec = store.jobs.get(jobId)
  if (!rec) return
  store.jobs.delete(jobId)
  const set = store.users.get(rec.ownerId)
  if (set) {
    set.delete(jobId)
    if (set.size === 0) store.users.delete(rec.ownerId)
  }
}
