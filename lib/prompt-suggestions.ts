// Prompt optimizer and fallback strategies used by the UI.

import type { VideoCreationRequest } from "@/components/create/generation-overlay"

export function suggestPromptFixes(prompt: string, errMsg?: string): string[] {
  const tips: string[] = []
  if (!prompt || prompt.length < 30)
    tips.push("Add more descriptive details: setting, subject, mood, and motion hints.")
  if (prompt.length > 800) tips.push("Shorten your prompt to the essential details for better consistency.")
  tips.push(
    "Avoid disallowed content keywords; prefer neutral, descriptive phrasing.",
    "Specify camera movement and lighting for clarity, e.g., 'gentle tracking shot, warm studio lighting'.",
  )
  if (errMsg && /policy|invalid|unsafe|nsfw|content/i.test(errMsg)) {
    tips.push("Reword sensitive terms and avoid explicit content to meet policy requirements.")
  }
  return tips
}

export function recommendLowerQuality(req: VideoCreationRequest): VideoCreationRequest {
  // Lower quality first, then duration, then motion
  const loweredQuality = req.options.quality === "high" ? "standard" : "standard"
  const shorter = Math.max(6, Math.round(req.durationSeconds * 0.8))
  const motion: VideoCreationRequest["options"]["motion"] =
    req.options.motion === "high" ? "medium" : req.options.motion === "medium" ? "low" : "low"
  return {
    ...req,
    durationSeconds: shorter,
    options: { ...req.options, quality: loweredQuality, motion },
  }
}

export function applyPolicyOptimizations(prompt: string) {
  // Light normalizations helpful for providers
  let p = prompt.trim()
  p = p.replace(/\s+/g, " ")
  p = p.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'")
  return p
}
