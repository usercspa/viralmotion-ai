"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, PiggyBank, GaugeCircle, Palette } from "lucide-react"

type Props = {
  script: string
  platforms: ("Instagram" | "TikTok" | "YouTube" | "LinkedIn")[]
  brandBg: string
  brandText: string
  current: {
    durationSeconds: number
    style: "cinematic" | "realistic" | "animated" | "corporate"
    motion: "low" | "medium" | "high"
    camera_movement: "static" | "pan" | "zoom" | "tracking"
    lighting: "natural" | "studio" | "dramatic"
    quality: "standard" | "high"
  }
  onApply: (patch: Partial<Props["current"]> & { durationSeconds?: number; negativePrompt?: string }) => void
}

function contrastRatio(hex1: string, hex2: string) {
  function luminance(hex: string) {
    const v = hex.replace("#", "")
    const r = Number.parseInt(v.slice(0, 2), 16) / 255
    const g = Number.parseInt(v.slice(2, 4), 16) / 255
    const b = Number.parseInt(v.slice(4, 6), 16) / 255
    const a = [r, g, b].map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]
  }
  const L1 = luminance(hex1)
  const L2 = luminance(hex2)
  const [max, min] = L1 > L2 ? [L1, L2] : [L2, L1]
  return (max + 0.05) / (min + 0.05)
}

function suggestDuration(platforms: Props["platforms"], current: number) {
  if (platforms.includes("TikTok") || platforms.includes("Instagram")) return Math.min(45, Math.max(12, current))
  if (platforms.includes("YouTube")) return Math.min(120, Math.max(20, current))
  if (platforms.includes("LinkedIn")) return Math.min(90, Math.max(20, current))
  return current
}

export function SmartSuggestions({ script, platforms, brandBg, brandText, current, onApply }: Props) {
  const cr = React.useMemo(() => contrastRatio(brandBg, brandText), [brandBg, brandText])

  const suggestions: {
    icon: React.ReactNode
    title: string
    desc: string
    apply: () => void
    pill?: string
  }[] = []

  // Prompt improvement (heuristic)
  if (!/CTA:/i.test(script)) {
    suggestions.push({
      icon: <Sparkles className="h-4 w-4" />,
      title: "Add a strong CTA",
      desc: "Include a concise CTA with a clear next step.",
      apply: () => onApply({}),
      pill: "Prompt",
    })
  }

  // Style suggestion based on brand background
  if (brandBg) {
    if (brandBg.toLowerCase() !== "#ffffff" && !["dramatic", "studio"].includes(current.lighting)) {
      suggestions.push({
        icon: <Palette className="h-4 w-4" />,
        title: "Lighting tweak",
        desc: "Darker backgrounds pop with dramatic or studio lighting.",
        apply: () => onApply({ lighting: "dramatic" }),
        pill: "Style",
      })
    }
  }

  // Duration optimization (platform-aware)
  const recommended = suggestDuration(platforms, current.durationSeconds)
  if (recommended !== current.durationSeconds) {
    suggestions.push({
      icon: <GaugeCircle className="h-4 w-4" />,
      title: "Adjust duration",
      desc: `Target ~${recommended}s for selected platforms.`,
      apply: () => onApply({ durationSeconds: recommended }),
      pill: "Timing",
    })
  }

  // Cost effective option (if high quality set)
  if (current.quality === "high") {
    suggestions.push({
      icon: <PiggyBank className="h-4 w-4" />,
      title: "Reduce cost",
      desc: "Switch to Standard quality for lower cost while you iterate.",
      apply: () => onApply({ quality: "standard" }),
      pill: "Cost",
    })
  }

  // Brand contrast compliance
  if (cr < 4.5) {
    suggestions.push({
      icon: <Palette className="h-4 w-4" />,
      title: "Improve contrast",
      desc: "Your brand text color is hard to read on the background. Consider a lighter text color.",
      apply: () => onApply({}),
      pill: "Compliance",
    })
  }

  if (suggestions.length === 0) {
    return null
  }

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle className="text-base">Smart Suggestions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {suggestions.map((s, idx) => (
          <div
            key={idx}
            className="flex items-start justify-between gap-3 rounded-md border border-white/10 bg-white/5 p-3"
          >
            <div className="flex min-w-0 items-start gap-2">
              <div className="mt-0.5 text-white/80">{s.icon}</div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">{s.title}</div>
                  {s.pill ? <Badge variant="secondary">{s.pill}</Badge> : null}
                </div>
                <div className="text-xs text-white/70">{s.desc}</div>
              </div>
            </div>
            <Button size="sm" variant="outline" className="shrink-0 bg-transparent" onClick={s.apply}>
              Apply
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
