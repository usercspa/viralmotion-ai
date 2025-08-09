// Runway service: submit, status, cancel, queue visibility, analytics, backoff polling.

import {
  RunwayAPIClient,
  RunwayQuotaExceededError,
  RunwayRateLimitedError,
  RunwayUnavailableError,
  RunwayValidationError,
} from "@/services/runway-api-client"
import {
  getJobStore,
  upsertJob,
  linkJobToUser,
  listUserJobs,
  getJob as getStoredJob,
  type JobRecord,
  type StoredJob,
  type StoredRequest,
} from "@/lib/job-store"
import { nextBackoff, type BackoffState } from "@/lib/backoff"
import { APIError } from "@/lib/api-error"
import { getQueueStatusForJob } from "@/lib/queue"
import { recordJobCreated, recordJobCompleted, recordJobCost } from "@/lib/analytics"
import type { JobQueueStatus } from "@/types/jobs"

export interface RunwayVideoRequest {
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

export interface RunwayVideoJob extends StoredJob {
  queue?: JobQueueStatus
  stage?: string
  stageDescription?: string
}

function toResolution(ratio?: "16:9" | "9:16" | "1:1") {
  switch (ratio) {
    case "9:16":
      return "1080x1920"
    case "1:1":
      return "1080x1080"
    case "16:9":
    default:
      return "1920x1080"
  }
}

function mapStatus(s: string): RunwayVideoJob["status"] {
  const u = s.toUpperCase()
  if (u.includes("QUEUE")) return "PENDING"
  if (u.includes("RUN")) return "RUNNING"
  if (u.includes("SUCC")) return "SUCCEEDED"
  if (u.includes("CANCEL")) return "CANCELLED"
  if (u.includes("FAIL") || u.includes("ERROR")) return "FAILED"
  return "RUNNING"
}

function estimateEtaMs(progress?: number, defaultSeconds = 150) {
  const p = typeof progress === "number" && progress > 0 ? progress : 5
  const remaining = Math.max(0, 100 - p)
  return Math.round((remaining / 100) * defaultSeconds * 1000)
}

async function extractVideoMetadata(urls?: string[]) {
  if (!urls || urls.length === 0) return {}
  try {
    const head = await fetch(urls[0], { method: "HEAD" })
    return {
      contentType: head.headers.get("content-type") || "",
      sizeBytes: Number(head.headers.get("content-length") || 0),
    }
  } catch {
    return {}
  }
}

function stageFor(status: string, progress?: number) {
  if (status === "PENDING" || (progress ?? 0) < 10) {
    return {
      stage: "Analyzing prompt",
      description: "Understanding your prompt and preparing generation parameters.",
    }
  }
  if (status === "RUNNING" && (progress ?? 0) < 90) {
    return {
      stage: "Generating video",
      description: "Synthesizing motion, camera, and scene details.",
    }
  }
  if (status === "RUNNING") {
    return {
      stage: "Processing",
      description: "Finalizing frames and encoding output.",
    }
  }
  if (status === "SUCCEEDED") {
    return { stage: "Completed", description: "Your video is ready." }
  }
  if (status === "FAILED") {
    return { stage: "Failed", description: "The job failed. You can retry with adjusted settings." }
  }
  if (status === "CANCELLED") {
    return { stage: "Cancelled", description: "The job was cancelled." }
  }
  return { stage: "Working", description: "The job is in progress." }
}

let POLLER_STARTED = false

function ensurePoller(service: RunwayAPIService) {
  if (POLLER_STARTED) return
  POLLER_STARTED = true
  const store = getJobStore()

  const tick = async () => {
    const now = Date.now()
    const due: string[] = []
    for (const [id, rec] of store.jobs) {
      if (rec.done) continue
      // timeout handling (12 minutes)
      const timeoutAt = rec.timeoutAt ?? rec.createdAtMs + 12 * 60_000
      if (now > timeoutAt) {
        rec.done = true
        rec.job.status = "FAILED"
        rec.job.failure = "Timed out while generating the video."
        rec.nextPollAt = undefined
        upsertJob(rec)
        continue
      }
      if (rec.nextPollAt && rec.nextPollAt <= now) due.push(id)
    }
    const batch = due.slice(0, 8) // concurrency limit
    await Promise.all(
      batch.map(async (id) => {
        if (store.pollLocks.has(id)) return
        store.pollLocks.add(id)
        try {
          await service.getJob(id)
        } catch (e) {
          const rec = store.jobs.get(id)
          if (rec) {
            if (e instanceof RunwayQuotaExceededError) {
              rec.done = true
              rec.job.status = "FAILED"
              rec.job.failure = "Quota exceeded during polling"
              rec.nextPollAt = undefined
            } else {
              rec.backoff = nextBackoff(rec.backoff as BackoffState | undefined, 1500, 1.6, 30_000)
              rec.nextPollAt = Date.now() + (rec.backoff?.nextDelayMs ?? 2500)
            }
            upsertJob(rec)
          }
        } finally {
          store.pollLocks.delete(id)
        }
      }),
    )
    // Garbage collect jobs finished > 1h
    for (const [id, rec] of store.jobs) {
      if (rec.done && Date.now() - (rec.completedAtMs ?? rec.createdAtMs) > 60 * 60_000) {
        store.jobs.delete(id)
      }
    }
  }

  setInterval(() => {
    tick().catch(() => {})
  }, 1000)
}

export class RunwayAPIService {
  private client: RunwayAPIClient

  constructor() {
    const keys = (process.env.RUNWAY_API_KEYS || process.env.RUNWAY_API_KEY || "").trim()
    if (!keys) throw new APIError("RUNWAY_API_KEY(S) not set", { status: 500, code: "NO_RUNWAY_KEYS" })
    this.client = new RunwayAPIClient({ baseURL: "https://api.runwayml.com/v1" })
    ensurePoller(this)
  }

  listActiveJobs(ownerId: string): RunwayVideoJob[] {
    return listUserJobs(ownerId)
      .filter((r) => !r.done)
      .map((r) => {
        const { stage, description } = stageFor(r.job.status, r.job.progress)
        return { ...r.job, queue: getQueueStatusForJob(r.job.id, ownerId), stage, stageDescription: description }
      })
  }

  getRecord(jobId: string): JobRecord | undefined {
    return getStoredJob(jobId)
  }

  // Submit job and track it
  async submitVideoJob(req: RunwayVideoRequest, ownerId: string): Promise<RunwayVideoJob> {
    if (!req.promptText || !req.taskType) throw new APIError("promptText and taskType are required", { status: 400 })

    const body: Record<string, any> = {
      task: req.taskType === "text-to-video" ? "text-to-video" : req.taskType,
      prompt: req.promptText,
      negative_prompt: req.negativePrompt,
      duration: req.duration ?? 8,
      resolution: toResolution(req.ratio),
      aspect_ratio: req.ratio ?? "16:9",
      seed: typeof req.seed === "number" ? req.seed : undefined,
      watermark: typeof req.watermark === "boolean" ? req.watermark : undefined,
      explore_mode: typeof req.exploreMode === "boolean" ? req.exploreMode : undefined,
      ...(req.providerPayload || {}),
    }

    let created: { id: string; status: string; estimated_time?: number; created_at?: string }
    try {
      created = await this.client.createVideoGeneration(body)
    } catch (e) {
      if (
        e instanceof RunwayValidationError ||
        e instanceof RunwayRateLimitedError ||
        e instanceof RunwayUnavailableError
      ) {
        throw e
      }
      throw new APIError("Failed to submit Runway job")
    }

    const job: RunwayVideoJob = {
      id: created.id,
      status: mapStatus(created.status),
      progress: 0,
      createdAt: created.created_at || new Date().toISOString(),
      task: body.task,
      ratio: req.ratio ?? "16:9",
      duration: body.duration,
      etaMs: (created.estimated_time ?? 150) * 1000,
    }

    const rec: JobRecord = {
      job,
      req: {
        taskType: req.taskType,
        promptText: req.promptText,
        duration: req.duration,
        ratio: req.ratio,
        seed: req.seed,
        watermark: req.watermark,
        exploreMode: req.exploreMode,
        negativePrompt: req.negativePrompt,
        providerPayload: req.providerPayload,
      } as StoredRequest,
      ownerId,
      lastPolledAt: Date.now(),
      nextPollAt: Date.now() + 1500,
      done: ["SUCCEEDED", "FAILED", "CANCELLED"].includes(job.status),
      createdAtMs: Date.now(),
      timeoutAt: Date.now() + 12 * 60_000, // 12 min timeout
      startedAtMs: Date.now(),
      retries: 0,
    }
    upsertJob(rec)
    linkJobToUser(ownerId, job.id)
    recordJobCreated(ownerId)
    // Rough cost estimate: $0.05/sec baseline (adjust as needed)
    const estCents = Math.round((job.duration ?? 8) * 5)
    recordJobCost(ownerId, estCents)

    return {
      ...job,
      queue: getQueueStatusForJob(job.id, ownerId),
      ...stageFor(job.status, job.progress),
    }
  }

  // Called by poller
  async getJob(jobId: string): Promise<RunwayVideoJob> {
    const data = await this.client.getJobStatus(jobId)
    const status = mapStatus(data.status)
    const store = getJobStore()
    const rec = store.jobs.get(jobId)

    const job: RunwayVideoJob = {
      id: data.id,
      status,
      progress: data.progress,
      createdAt: data.created_at || rec?.job.createdAt || new Date().toISOString(),
      task: "inference",
      output: data.output,
      failure: data.error?.message,
      failureCode: data.error?.code,
      etaMs: estimateEtaMs(data.progress),
      metadata: status === "SUCCEEDED" ? await extractVideoMetadata(data.output) : undefined,
    }

    if (rec) {
      const prevProgress = rec.job.progress ?? 0
      rec.job = { ...rec.job, ...job }
      rec.lastPolledAt = Date.now()
      const becameDone = ["SUCCEEDED", "FAILED", "CANCELLED"].includes(job.status)
      if (becameDone && !rec.done) {
        rec.completedAtMs = Date.now()
        const elapsed = rec.startedAtMs ? rec.completedAtMs - rec.startedAtMs : 0
        recordJobCompleted(rec.ownerId, elapsed, job.status === "SUCCEEDED", job.failureCode)
      }
      rec.done = becameDone
      if (!rec.done) {
        if (typeof job.progress === "number" && job.progress > prevProgress) {
          rec.backoff = undefined
        }
        rec.backoff = nextBackoff(rec.backoff as BackoffState | undefined, 1500, 1.6, 30_000)
        rec.nextPollAt = Date.now() + (rec.backoff?.nextDelayMs ?? 2500)
      } else {
        rec.nextPollAt = undefined
      }
      upsertJob(rec)
      const { stage, description } = stageFor(job.status, job.progress)
      return { ...rec.job, queue: getQueueStatusForJob(jobId, rec.ownerId), stage, stageDescription: description }
    }

    // Not tracked (edge case)
    const stageInfo = stageFor(job.status, job.progress)
    return { ...job, ...stageInfo }
  }

  async cancelJob(jobId: string): Promise<RunwayVideoJob> {
    const data = await this.client.cancelJob(jobId)
    const job: RunwayVideoJob = {
      id: data.id,
      status: mapStatus(data.status),
      progress: data.progress,
      createdAt: data.created_at || new Date().toISOString(),
      task: "inference",
      output: data.output,
      failure: data.error?.message,
      failureCode: data.error?.code,
    }
    const rec = this.getRecord(jobId)
    if (rec) {
      rec.job = { ...rec.job, ...job }
      rec.done = ["SUCCEEDED", "FAILED", "CANCELLED"].includes(job.status)
      rec.nextPollAt = undefined
      upsertJob(rec)
      const { stage, description } = stageFor(job.status, job.progress)
      return { ...rec.job, queue: getQueueStatusForJob(jobId, rec.ownerId), stage, stageDescription: description }
    }
    const { stage, description } = stageFor(job.status, job.progress)
    return { ...job, stage, stageDescription: description }
  }

  // Retry by cloning original request (if available)
  async retryJob(jobId: string, ownerId: string): Promise<RunwayVideoJob> {
    const rec = this.getRecord(jobId)
    if (!rec) throw new APIError("Job not found", { status: 404 })
    const req = rec.req
    return await this.submitVideoJob(
      {
        taskType: req.taskType,
        promptText: req.promptText,
        duration: req.duration,
        ratio: req.ratio,
        seed: req.seed,
        watermark: req.watermark,
        exploreMode: req.exploreMode,
        negativePrompt: req.negativePrompt,
        providerPayload: req.providerPayload,
      },
      ownerId,
    )
  }
}
