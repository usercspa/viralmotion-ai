export function estimateCostCents(input: {
  seconds: number
  quality: "standard" | "high"
  style: "cinematic" | "realistic" | "animated" | "corporate"
  count?: number
}) {
  // Simple heuristic cost model — adjust to match your provider pricing
  const basePerSecondCents = input.quality === "high" ? 1.8 : 1.0
  const styleMultiplier =
    input.style === "cinematic" || input.style === "realistic" ? 1.2 : input.style === "animated" ? 1.1 : 1.0
  const perVideo = Math.round(input.seconds * basePerSecondCents * styleMultiplier)
  return Math.max(25, Math.round(perVideo * (input.count ?? 1)))
}
