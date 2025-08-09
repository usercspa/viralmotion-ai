// Lightweight quality and safety checks using metadata heuristics.
// For richer checks, integrate a dedicated media analysis service.

export type QualityReport = {
  score: number // 0-100
  reasons: string[]
  safe: boolean
  suggestRegenerate: boolean
}

export async function checkQuality(outputUrls?: string[]): Promise<QualityReport> {
  const reasons: string[] = []
  let score = 70
  let safe = true

  if (!outputUrls || outputUrls.length === 0) {
    reasons.push("No output URLs returned")
    return { score: 0, reasons, safe: false, suggestRegenerate: true }
  }

  try {
    const head = await fetch(outputUrls[0], { method: "HEAD" })
    if (!head.ok) {
      reasons.push(`HEAD request failed: ${head.status}`)
      score -= 40
    } else {
      const ct = head.headers.get("content-type") || ""
      const len = Number(head.headers.get("content-length") || 0)
      if (!ct.startsWith("video/")) {
        reasons.push("Output is not a video content-type")
        score -= 40
      }
      if (len < 200_000) {
        reasons.push("Output file appears too small; may be corrupted")
        score -= 30
      }
    }
  } catch {
    reasons.push("Metadata check failed (network)")
    score -= 20
  }

  // Very light content safety placeholder
  // You can integrate provider safety signals or your own ML checks
  if (outputUrls[0].toLowerCase().includes("nsfw")) {
    reasons.push("Potential unsafe content flag in URL")
    safe = false
    score = Math.min(score, 40)
  }

  const suggestRegenerate = score < 60 || !safe
  return { score: Math.max(0, Math.min(100, score)), reasons, safe, suggestRegenerate }
}
