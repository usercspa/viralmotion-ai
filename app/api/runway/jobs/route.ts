import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getRunwayService } from "@/services/runway-service-singleton"
import type { RunwayVideoRequest } from "@/services/runway-api"
import { getRunwayJobManager } from "@/services/runway-job-manager"
import { mapUnknownErrorToRunwayError } from "@/lib/runway-error-mapper"
import { estimateRequestCost } from "@/services/video-generation"
import { checkPromptPolicy } from "@/lib/policy"
import { recommendLowerQuality, applyPolicyOptimizations } from "@/lib/prompt-suggestions"
import { getQueue } from "@/lib/queue"
import { recordRequest, recordError, recordRecovery } from "@/lib/error-analytics"

function getOwnerId(): string {
  const jar = cookies()
  let id = jar.get("vvm_owner_id")?.value
  if (!id) {
    id = crypto.randomUUID()
    jar.set("vvm_owner_id", id, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 })
  }
  return id
}

export async function GET() {
  try {
    const ownerId = getOwnerId()
    const service = getRunwayService()
    const jobs = service.listActiveJobs(ownerId)
    return NextResponse.json({ jobs })
  } catch (e: any) {
    const error = mapUnknownErrorToRunwayError(e)
    return NextResponse.json({ error }, { status: error.status || 500 })
  }
}

export async function POST(req: Request) {
  recordRequest()
  const ownerId = getOwnerId()
  try {
    const body = (await req.json()) as RunwayVideoRequest & { script?: string; promptText?: string }
    const script = (body.promptText || body.script || "").toString()
    const policy = checkPromptPolicy(script)
    if (!policy.ok) {
      const error = {
        type: "invalid_prompt",
        message: policy.issues.join("; "),
        userMessage: "Your prompt may violate content policy or is too long. Please adjust the language and try again.",
        retryable: false,
        suggestedAction: "Revise the prompt to be clearer and policy-compliant.",
        status: 422,
      }
      return NextResponse.json({ error }, { status: 422 })
    }

    // Apply light prompt normalization
    const optimizedScript = applyPolicyOptimizations(policy.sanitizedPrompt)
    ;(body as any).promptText = optimizedScript
    ;(body as any).script = optimizedScript

    const service = getRunwayService()

    // Progressive quality reduction on transient generation failures/timeouts
    const maxAttempts = 3
    let attempt = 0
    let lastErr: any = null
    while (attempt < maxAttempts) {
      try {
        const job = await service.submitVideoJob(body, ownerId)
        getRunwayJobManager().startPolling(job.id)
        const estimatedCostCents = estimateRequestCost(
          {
            script: optimizedScript,
            durationSeconds: (body as any).duration || (body as any).durationSeconds || 15,
            ratio: ((body as any).ratio as any) || "9:16",
            options: {
              style: ((body as any).style as any) || "cinematic",
              motion: ((body as any).motion as any) || "medium",
              camera_movement: ((body as any).camera_movement as any) || "pan",
              lighting: ((body as any).lighting as any) || "natural",
              quality: ((body as any).quality as any) || "standard",
            },
            variationCount: ((body as any).variationCount as any) || 1,
            templateId: ((body as any).templateId as any) || null,
            brand: ((body as any).brand as any) || null,
          } as any,
          1,
        )
        recordRecovery()
        return NextResponse.json({ jobs: [job], estimatedCostCents })
      } catch (e: any) {
        lastErr = e
        // Rate limit -> smart queue (202 Accepted) if queueing is preferable
        if (e?.status === 429) {
          const queue = getQueue()
          const position = queue.stats().queued + 1
          // Enqueue submission to run soon
          queue
            .enqueue({
              id: crypto.randomUUID(),
              body,
              ownerId,
              run: async () => {
                const j = await service.submitVideoJob(body, ownerId)
                getRunwayJobManager().startPolling(j.id)
                return j
              },
            })
            .catch(() => {
              // errors inside queue are recorded separately by job manager
            })
          const resp = {
            queued: true,
            position,
            message: "High demand. Your request was queued and will start shortly.",
          }
          return NextResponse.json(resp, { status: 202 })
        }

        // Transient provider issues -> reduce quality and retry
        if (e?.status && [500, 502, 503, 504].includes(e.status)) {
          attempt++
          // Lower quality/duration progressively
          body as any
          const current = {
            script: optimizedScript,
            durationSeconds: (body as any).duration || (body as any).durationSeconds || 15,
            ratio: ((body as any).ratio as any) || "9:16",
            options: {
              style: ((body as any).style as any) || "cinematic",
              motion: ((body as any).motion as any) || "medium",
              camera_movement: ((body as any).camera_movement as any) || "pan",
              lighting: ((body as any).lighting as any) || "natural",
              quality: ((body as any).quality as any) || "standard",
            },
          }
          const downgraded = recommendLowerQuality(current as any)
          ;(body as any).duration = downgraded.durationSeconds
          ;(body as any).durationSeconds = downgraded.durationSeconds
          ;(body as any).motion = downgraded.options.motion
          ;(body as any).quality = downgraded.options.quality
          await new Promise((r) => setTimeout(r, 800 * attempt))
          continue
        }

        // Other errors -> break
        break
      }
    }

    // If we got here, return structured error
    const error = mapUnknownErrorToRunwayError(lastErr)
    recordError(ownerId, error)
    return NextResponse.json({ error }, { status: error.status || 500 })
  } catch (e: any) {
    const error = mapUnknownErrorToRunwayError(e)
    recordError(ownerId, error)
    return NextResponse.json({ error }, { status: error.status || 500 })
  }
}
