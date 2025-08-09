// Queue visibility and estimation helpers

import { getJobStore } from "./job-store"
import { getUserAnalytics } from "./analytics"
import type { JobQueueStatus } from "@/types/jobs"

export function getQueueStatusForJob(jobId: string, ownerId: string): JobQueueStatus {
  const store = getJobStore()
  const entries = Array.from(store.jobs.values()).filter((r) => !r.done)
  entries.sort((a, b) => a.createdAtMs - b.createdAtMs)

  const position = Math.max(
    0,
    entries.findIndex((r) => r.job.id === jobId),
  )
  const queueLength = entries.length
  const userAvg = getUserAnalytics(ownerId).averageGenerationTimeMs
  const globalAvg = 120_000 // fallback baseline
  const averageProcessingTime = Math.round((userAvg + globalAvg) / 2)
  const estimatedStartTime = new Date(Date.now() + Math.max(0, position) * averageProcessingTime)
  return {
    position,
    estimatedStartTime,
    queueLength,
    averageProcessingTime,
  }
}

export function getQueueSnapshot() {
  const store = getJobStore()
  const entries = Array.from(store.jobs.values()).filter((r) => !r.done)
  entries.sort((a, b) => a.createdAtMs - b.createdAtMs)
  const queueLength = entries.length
  const averageProcessingTime = 120_000
  return {
    queueLength,
    averageProcessingTime,
    headJobId: entries[0]?.job.id || null,
    nextEstimatedStart: entries[0] ? new Date(Date.now() + averageProcessingTime) : null,
  }
}
