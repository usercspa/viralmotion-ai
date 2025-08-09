import { BaseAPIService } from "./base"
import type {
  GenerateScriptRequest,
  GenerateScriptResponse,
  StartVideoJobRequest,
  StartVideoJobResponse,
  JobStatus,
} from "@/types/api"

function estimateDuration(script: string) {
  const words = script.trim().split(/\s+/).filter(Boolean).length
  return Math.max(12, Math.round(words / 2.5))
}

export class MockVideoGenerationService extends BaseAPIService {
  async generateScript(payload: GenerateScriptRequest): Promise<GenerateScriptResponse> {
    return this.doRequest(async () => {
      await new Promise((r) => setTimeout(r, 600))
      const hookMap: Record<GenerateScriptRequest["tone"], string[]> = {
        professional: [
          "Here’s a concise way to solve this today.",
          "Three data-backed insights you can use now.",
          "If you run a team, this will save you hours.",
        ],
        casual: [
          "Okay, real talk — this changes everything.",
          "You won't believe how quick this is.",
          "Do this today.",
        ],
        humorous: [
          "I did this so you don't have to.",
          "Coffee #2 and we already fixed it.",
          "POV: you actually ship your MVP on time.",
        ],
        urgent: [
          "Stop scrolling. Do this before your next launch.",
          "You're leaving growth on the table.",
          "This takes 5 minutes and changes your week.",
        ],
      }
      const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
      const hook = pick(hookMap[payload.tone])
      const typeLine: Record<GenerateScriptRequest["videoType"], string> = {
        product_demo: "Watch how it works in 20 seconds — no fluff.",
        thought_leadership: "A quick framework I use with founders.",
        behind_the_scenes: "Here’s a peek at our real workflow.",
      }
      const platformLine = payload.platforms.length
        ? `Optimized for ${payload.platforms.join(", ")}.`
        : "Optimized for all short-form platforms."
      const body =
        payload.videoType === "product_demo"
          ? `1) Problem in one sentence. 2) Click-by-click solution. 3) Before/after result.`
          : payload.videoType === "thought_leadership"
            ? `1) Hook with a question. 2) 3-point framework. 3) Actionable takeaway.`
            : `1) Raw moment. 2) Micro-lesson. 3) CTA to follow for more.`

      const script = `HOOK: ${hook}
${typeLine[payload.videoType]} ${platformLine}

BODY:
${body}

CTA:
Try it today and comment "DEMO" for the checklist.

${payload.idea ? `Context: ${payload.idea}` : ""}`.trim()

      return { script, estimatedSeconds: estimateDuration(script) }
    })
  }

  async startVideoJob(req: StartVideoJobRequest): Promise<StartVideoJobResponse> {
    return this.doRequest(async () => {
      await new Promise((r) => setTimeout(r, 300))
      const jobId = `job_${Math.random().toString(36).slice(2, 8)}`
      // Store job state in-memory for mock
      jobs.set(jobId, { jobId, status: "queued", progress: 0 })
      progressJob(jobId)
      return { jobId, status: "queued" }
    })
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    return this.doRequest(async () => {
      await new Promise((r) => setTimeout(r, 200))
      const state = jobs.get(jobId)
      if (!state) return { jobId, status: "failed", error: "Job not found" }
      return state
    })
  }
}

// Mock job state
const jobs = new Map<string, any>()

function progressJob(jobId: string) {
  let p = 0
  const interval = setInterval(() => {
    p = Math.min(100, p + Math.round(10 + Math.random() * 25))
    const cur = jobs.get(jobId)
    if (!cur) return clearInterval(interval)
    if (p >= 100) {
      jobs.set(jobId, {
        jobId,
        status: "completed",
        url: "/sample-preview.mp4",
        thumbnail: "/video-thumbnail-concept.png?height=720&width=1280&query=generated",
      })
      return clearInterval(interval)
    } else {
      jobs.set(jobId, { jobId, status: p < 10 ? "queued" : "processing", progress: p })
    }
  }, 400)
}
