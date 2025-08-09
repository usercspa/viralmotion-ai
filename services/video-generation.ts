// High-level video generation orchestration with smart prompt engineering, batches, cost and QA.

import type { RunwayAPIService, RunwayVideoJob } from "@/services/runway-api"
import { estimateCostCents, type Quality, type Style } from "@/services/cost"
import { checkQuality } from "@/services/quality"
import { getRunwayStore, getUserTier } from "@/lib/global-store"
import { tierLimits } from "@/services/cost"

export type AdvancedRunwayOptions = {
  style: "cinematic" | "realistic" | "animated" | "corporate"
  motion: "low" | "medium" | "high"
  camera_movement: "static" | "pan" | "zoom" | "tracking"
  lighting: "natural" | "studio" | "dramatic"
  quality: "standard" | "high"
}

export type VideoCreationRequest = {
  script: string
  durationSeconds: number
  ratio: "16:9" | "9:16" | "1:1"
  seed?: number
  negativePrompt?: string
  options: AdvancedRunwayOptions
  variationCount?: number
  autoRegenerateOnLowQuality?: boolean
  templateId?: string | null
  brand?: { primary?: string; secondary?: string; logoUrl?: string | null; font?: string | null } | null
}

function optimizeDuration(seconds: number) {
  return Math.max(5, Math.min(180, Math.round(seconds)))
}

function styleModifiers(opts: AdvancedRunwayOptions) {
  const mods: string[] = []
  // Style
  if (opts.style === "cinematic") mods.push("cinematic, filmic look, shallow depth of field, dynamic lighting")
  if (opts.style === "realistic") mods.push("photorealistic, detailed textures, natural motion")
  if (opts.style === "animated") mods.push("stylized animation, smooth frame transitions, bold colors")
  if (opts.style === "corporate") mods.push("clean, professional, brand-safe, minimalistic visuals")
  // Motion
  if (opts.motion === "low") mods.push("subtle motion")
  if (opts.motion === "medium") mods.push("moderate motion")
  if (opts.motion === "high") mods.push("energetic motion, fast cuts")
  // Camera
  if (opts.camera_movement === "static") mods.push("static camera")
  if (opts.camera_movement === "pan") mods.push("smooth panning camera")
  if (opts.camera_movement === "zoom") mods.push("gentle zooms")
  if (opts.camera_movement === "tracking") mods.push("tracking shots")
  // Lighting
  if (opts.lighting === "natural") mods.push("natural lighting")
  if (opts.lighting === "studio") mods.push("studio lighting, soft key fill")
  if (opts.lighting === "dramatic") mods.push("dramatic lighting, high contrast")
  // Quality
  if (opts.quality === "high") mods.push("high-quality render, crisp details")
  return mods.join(", ")
}

function negativeDefaults() {
  return [
    "text artifacts",
    "watermarks",
    "low-resolution",
    "overexposed",
    "motion blur",
    "distorted faces",
    "brand-inaccurate colors",
    "logos",
  ].join(", ")
}

function buildPrompt(req: VideoCreationRequest) {
  const baseScript = req.script.trim()
  const modifiers = styleModifiers(req.options)
  const ratio = req.ratio
  const duration = optimizeDuration(req.durationSeconds)
  const brandBits: string[] = []
  if (req.templateId) brandBits.push(`template:${req.templateId}`)
  if (req.brand?.primary) brandBits.push(`brand_primary:${req.brand.primary}`)
  if (req.brand?.secondary) brandBits.push(`brand_accent:${req.brand.secondary}`)
  if (req.brand?.font) brandBits.push(`brand_font:${req.brand.font}`)

  const prompt =
    `SCRIPT:\n${baseScript}\n` +
    `STYLE MODIFIERS: ${modifiers}\n` +
    (brandBits.length ? `BRAND: ${brandBits.join(", ")}\n` : "") +
    `ASPECT RATIO: ${ratio}\n` +
    `TARGET DURATION: ${duration}s\n` +
    `RENDER INTENT: short-form social video, clear subject, engaging visuals, concise scene flow`

  const neg = `${negativeDefaults()}${req.negativePrompt ? `, ${req.negativePrompt}` : ""}`

  return { prompt, negativePrompt: neg, duration, ratio }
}

export function estimateRequestCost(req: VideoCreationRequest, count: number) {
  return estimateCostCents({
    seconds: optimizeDuration(req.durationSeconds),
    quality: req.options.quality as Quality,
    style: req.options.style as Style,
    count,
  })
}

export class RunwayVideoGenerationService {
  constructor(private runway: RunwayAPIService) {}

  async generateVideo(request: VideoCreationRequest, ownerId: string) {
    const { prompt, negativePrompt, duration, ratio } = buildPrompt(request)
    return await this.runway.submitVideoJob(
      {
        taskType: "text-to-video",
        promptText: `${prompt}\nNEGATIVE: ${negativePrompt}`,
        duration,
        ratio,
        seed: request.seed,
        watermark: true,
        exploreMode: false,
      },
      ownerId,
    )
  }

  async generateBatch(request: VideoCreationRequest, ownerId: string) {
    const variationCount = Math.max(1, Math.min(6, request.variationCount || 1))
    const jobs: RunwayVideoJob[] = []
    for (let i = 0; i < variationCount; i++) {
      const seed = typeof request.seed === "number" ? request.seed + i : Math.floor(Math.random() * 1_000_000)
      const job = await this.generateVideo({ ...request, seed }, ownerId)
      jobs.push(job)
    }
    return jobs
  }

  // After completion; perform basic QA and optionally signal regenerate recommendation
  async qualityCheck(job: RunwayVideoJob) {
    const report = await checkQuality(job.output)
    return report
  }

  enforceUserLimits(ownerId: string, req: VideoCreationRequest, count: number) {
    const { usage } = getRunwayStore()
    const tier = getUserTier(ownerId)
    const limits = tierLimits(tier)
    const estCents = estimateRequestCost(req, count)
    const estSeconds = optimizeDuration(req.durationSeconds) * count
    const today = new Date().toISOString().slice(0, 10)
    const current = usage.get(ownerId)
    const sameDay = current?.updatedAt?.startsWith(today)
    const seconds = (sameDay ? current!.seconds : 0) + estSeconds
    const spend = (sameDay ? current!.spendCents : 0) + estCents
    if (spend > limits.maxDailyCents || seconds > limits.maxDailySeconds) {
      return { allowed: false, estCents, estSeconds, tier, limits }
    }
    usage.set(ownerId, {
      seconds,
      spendCents: spend,
      updatedAt: new Date().toISOString(),
      tier,
    })
    return { allowed: true, estCents, estSeconds, tier, limits }
  }
}
