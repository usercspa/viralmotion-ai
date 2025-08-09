"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Stepper, type Step } from "@/components/wizard/stepper"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Loader2, RefreshCcw, Save, Sparkles } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { GenerationOverlay, type VideoCreationRequest } from "@/components/create/generation-overlay"
import { estimateCostCents } from "@/services/cost"
import { TrendHints } from "@/components/create/trend-hints"
import { SmartSuggestions } from "@/components/create/smart-suggestions"
import { AdvancedControls } from "@/components/create/advanced-controls"
import { BrandCheck } from "@/components/brand/brand-check"
import { PublishSheet } from "@/components/publish/publish-sheet"

type VideoType = "product_demo" | "thought_leadership" | "behind_the_scenes"
type Tone = "professional" | "casual" | "humorous" | "urgent"
type Platform = "Instagram" | "TikTok" | "YouTube" | "LinkedIn"
type LogoPlacement = "top-left" | "top-right" | "bottom-left" | "bottom-right"

type WizardState = {
  // step 1
  idea: string
  videoType: VideoType
  tone: Tone
  platforms: Platform[]
  // step 2
  generating: boolean
  progress: number
  script: string
  estimatedSeconds: number
  // step 3
  templateId: string | null
  // step 4
  brandBg: string
  brandText: string
  logoFile?: File | null
  logoUrl?: string | null
  logoPlacement: LogoPlacement
  // advanced
  style: "cinematic" | "realistic" | "animated" | "corporate"
  motion: "low" | "medium" | "high"
  camera_movement: "static" | "pan" | "zoom" | "tracking"
  lighting: "natural" | "studio" | "dramatic"
  quality: "standard" | "high"
  negativePrompt: string
  variationCount: number
  autoRegenerate: boolean
}

const steps: Step[] = [
  { id: 1, title: "Content Input", description: "Describe your idea" },
  { id: 2, title: "Script", description: "AI generates and you edit" },
  { id: 3, title: "Template", description: "Pick a style" },
  { id: 4, title: "Brand & Options", description: "Apply your brand and options" },
]

const templates = [
  { id: "temp-1", name: "Bold Gradient", bestFor: "Hooks & Promos", img: "/bold-gradient-short-form-template.png" },
  { id: "temp-2", name: "Minimal Overlay", bestFor: "Product Demos", img: "/minimal-overlay-ui.png" },
  { id: "temp-3", name: "Caption Focus", bestFor: "Tutorials", img: "/caption-first-shorts-template.png" },
  { id: "temp-4", name: "B-Roll Split", bestFor: "Behind the Scenes", img: "/placeholder-v0imc.png" },
  { id: "temp-5", name: "Energetic Pop", bestFor: "Lifestyle", img: "/energetic-pop-shorts-template.png" },
  { id: "temp-6", name: "Clean Corner", bestFor: "Thought Leadership", img: "/clean-corner-speaking-template.png" },
  { id: "temp-7", name: "Dark Neon", bestFor: "Tech Products", img: "/dark-neon-tech-template.png" },
  { id: "temp-8", name: "Motion Blocks", bestFor: "Announcements", img: "/motion-blocks-template.png" },
]

function estimateDuration(script: string) {
  const words = script.trim().split(/\s+/).filter(Boolean).length
  const seconds = Math.max(12, Math.round(words / 2.5))
  return seconds
}
function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}
function generateMockScript(idea: string, type: VideoType, tone: Tone, platforms: Platform[]) {
  const hookByTone: Record<Tone, string[]> = {
    professional: [
      "Here's a concise way to solve this today.",
      "Three data-backed insights you can use now.",
      "If you run a team, this will save you hours.",
    ],
    casual: [
      "Okay, real talk — this changes everything.",
      "You won't believe how quick this is.",
      "Here's the easiest way I found.",
    ],
    humorous: [
      "I did this so you don't have to. You're welcome.",
      "Coffee #2 and we already fixed it.",
      "POV: You actually ship your MVP on time.",
    ],
    urgent: [
      "Stop scrolling. Do this before your next launch.",
      "You're leaving growth on the table — fix it today.",
      "This takes 5 minutes and changes your week.",
    ],
  }
  const typeLine: Record<VideoType, string> = {
    product_demo: "Watch how it works in 20 seconds — no fluff.",
    thought_leadership: "A quick framework I use with founders.",
    behind_the_scenes: "Here’s a peek at our real workflow.",
  }
  const hook = hookByTone[tone][Math.floor(Math.random() * hookByTone[tone].length)]
  const platformLine = platforms.length
    ? `Optimized for ${platforms.join(", ")}.`
    : "Optimized for all short-form platforms."
  const body =
    type === "product_demo"
      ? `1) Problem in one sentence. 2) Click-by-click solution. 3) Before/after result.`
      : type === "thought_leadership"
        ? `1) Hook with a question. 2) 3-point framework. 3) Actionable takeaway.`
        : `1) Raw moment. 2) Micro-lesson. 3) CTA to follow for more.`
  const cta = `CTA: Try it today and comment "DEMO" for the checklist.`

  return `HOOK: ${hook}
${typeLine[type]} ${platformLine}

BODY:
${body}

CTA:
${cta}

${idea ? `Context: ${idea}` : ""}`.trim()
}

const PREFS_KEY = "vvm:gen-prefs"

export default function CreateWizardPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const [step, setStep] = React.useState(0)

  const [state, setState] = React.useState<WizardState>({
    idea: "",
    videoType: "product_demo",
    tone: "professional",
    platforms: [],
    generating: false,
    progress: 0,
    script: "",
    estimatedSeconds: 0,
    templateId: null,
    brandBg: "#0B0B0F",
    brandText: "#FFFFFF",
    logoFile: null,
    logoUrl: null,
    logoPlacement: "top-left",
    style: "cinematic",
    motion: "medium",
    camera_movement: "static",
    lighting: "natural",
    quality: "standard",
    negativePrompt: "",
    variationCount: 1,
    autoRegenerate: true,
  })

  const [abPrompt, setAbPrompt] = React.useState<{ a?: string; b?: string }>({})
  const [publishOpen, setPublishOpen] = React.useState(false)
  const [lastVideoUrl, setLastVideoUrl] = React.useState<string | null>(null)

  // Load defaults from Preferences
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY)
      if (raw) {
        const prefs = JSON.parse(raw)
        setState((s) => ({
          ...s,
          style: prefs.style ?? s.style,
          motion: prefs.motion ?? s.motion,
          camera_movement: prefs.camera_movement ?? s.camera_movement,
          lighting: prefs.lighting ?? s.lighting,
          quality: prefs.quality ?? s.quality,
          negativePrompt: prefs.negativePrompt ?? s.negativePrompt,
          variationCount: prefs.variationCount ?? s.variationCount,
        }))
      }
    } catch {}
  }, [])

  // Auth guard
  React.useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/sign-in")
    }
  }, [loading, user, router])

  // Simulate script gen progress client-side
  React.useEffect(() => {
    if (state.generating) {
      let p = 0
      const id = setInterval(() => {
        p = Math.min(100, p + Math.round(Math.random() * 18))
        setState((s) => ({ ...s, progress: p }))
        if (p >= 100) {
          clearInterval(id)
          const script = generateMockScript(state.idea, state.videoType, state.tone, state.platforms)
          const est = estimateDuration(script)
          setState((s) => ({ ...s, script, estimatedSeconds: est, generating: false }))
        }
      }, 300)
      return () => clearInterval(id)
    }
  }, [state.generating, state.idea, state.videoType, state.tone, state.platforms])

  function canNext() {
    if (step === 0) return state.idea.trim().length > 10 && state.platforms.length > 0
    if (step === 1) return !state.generating && state.script.trim().length > 20
    if (step === 2) return !!state.templateId
    return true
  }

  function onSaveDraft() {
    const id = crypto.randomUUID()
    const draftsKey = "vvm:drafts"
    const saved = {
      id,
      title: state.idea.slice(0, 48) || "Untitled Draft",
      status: "draft",
      updatedAt: new Date().toISOString(),
      state,
    }
    try {
      const raw = localStorage.getItem(draftsKey)
      const arr = raw ? JSON.parse(raw) : []
      arr.unshift(saved)
      localStorage.setItem(draftsKey, JSON.stringify(arr))
      toast({ title: "Saved as draft", description: "You can resume from My Videos later." })
    } catch {
      toast({ title: "Could not save draft", description: "Please try again.", variant: "destructive" })
    }
  }

  function preferredRatio(): "9:16" | "16:9" | "1:1" {
    if (state.platforms.includes("TikTok") || state.platforms.includes("Instagram")) return "9:16"
    return "16:9"
  }

  // Smart prompt engineering: build optimized prompt from script and options
  function buildOptimizedPrompt() {
    const effectiveScript = abPrompt.a || state.script
    const lines = [
      `Style: ${state.style}; motion: ${state.motion}; camera: ${state.camera_movement}; lighting: ${state.lighting}; quality: ${state.quality}.`,
      `Aspect: ${preferredRatio()} • Duration: ~${state.estimatedSeconds || 20}s.`,
      `Guidance: high clarity, on-brand color accents. Avoid noisy text overlays.`,
      state.negativePrompt ? `Negative: ${state.negativePrompt}` : "",
      "Script:",
      effectiveScript,
    ]
    return lines.filter(Boolean).join("\n")
  }

  // Generation overlay
  const [genOpen, setGenOpen] = React.useState(false)
  const [genRequest, setGenRequest] = React.useState<VideoCreationRequest | null>(null)

  const estCents = React.useMemo(() => {
    return estimateCostCents({
      seconds: state.estimatedSeconds || 20,
      quality: state.quality,
      style: state.style,
      count: Math.max(1, Math.min(6, state.variationCount || 1)),
    })
  }, [state.estimatedSeconds, state.quality, state.style, state.variationCount])

  function onFinish() {
    if (!state.script) {
      toast({ title: "Add a script first", description: "Generate or paste your script.", variant: "destructive" })
      setStep(1)
      return
    }
    const req: VideoCreationRequest = {
      script: buildOptimizedPrompt(),
      durationSeconds: state.estimatedSeconds || 20,
      ratio: preferredRatio(),
      negativePrompt: state.negativePrompt.trim() || undefined,
      options: {
        style: state.style,
        motion: state.motion,
        camera_movement: state.camera_movement,
        lighting: state.lighting,
        quality: state.quality,
      },
      variationCount: Math.max(1, Math.min(6, state.variationCount || 1)),
      autoRegenerateOnLowQuality: state.autoRegenerate,
      templateId: state.templateId,
      brand: { primary: state.brandBg, secondary: state.brandText, logoUrl: state.logoUrl || null, font: null },
    }
    setGenRequest(req)
    setGenOpen(true)
  }

  function handleGenerationSuccess(
    jobs: { id: string; status: string; output?: string[] | undefined }[],
    urls: (string | null)[],
  ) {
    const videosKey = "vvm:videos"
    const now = new Date().toISOString()
    const entries = jobs.map((job, idx) => ({
      id: crypto.randomUUID(),
      title: `${state.idea.slice(0, 64) || "New Video"}${jobs.length > 1 ? ` — V${idx + 1}` : ""}`,
      status: job.status === "SUCCEEDED" ? ("ready" as const) : ("error" as const),
      duration: formatDuration(state.estimatedSeconds || 30),
      thumbnail: "/video-thumbnail-concept.png?height=720&width=1280&query=generated%20video",
      createdAt: now,
      url: urls[idx] || null,
      jobId: job.id,
      provider: "runway",
      state,
    }))
    try {
      const raw = localStorage.getItem(videosKey)
      const arr = raw ? JSON.parse(raw) : []
      localStorage.setItem(videosKey, JSON.stringify([...entries, ...arr]))
      setLastVideoUrl(urls.find(Boolean) || null)
      setGenOpen(false)
      if (jobs.length === 1 && urls[0]) {
        setPublishOpen(true)
      } else {
        router.push(`/videos`)
      }
    } catch {
      toast({ title: "Could not store video(s)", description: "Please try again.", variant: "destructive" })
    }
  }

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
        <div className="mt-4 h-44 animate-pulse rounded-lg bg-white/10" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-2 text-sm text-muted-foreground">Let’s make a great video</div>
      <Stepper steps={steps} current={step} onStepClick={(idx) => idx < step && setStep(idx)} />

      {step === 0 && (
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle>Describe your content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="idea">Content description or idea</Label>
              <Textarea
                id="idea"
                placeholder="Describe your product, the key benefit, and any hook you want to include…"
                className="min-h-[140px] bg-white/5 text-white placeholder:text-white/40"
                value={state.idea}
                onChange={(e) => setState({ ...state, idea: e.target.value })}
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60">Try adding a trend:</span>
                <TrendHints onInsert={(text) => setState((s) => ({ ...s, idea: (s.idea + " " + text).trim() }))} />
              </div>
              <p className="text-xs text-white/50">Tip: Great hooks are surprising, specific, or contrarian.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="videoType">Video type</Label>
                <select
                  id="videoType"
                  className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
                  value={state.videoType}
                  onChange={(e) => setState({ ...state, videoType: e.target.value as any })}
                >
                  <option value="product_demo">Product demo</option>
                  <option value="thought_leadership">Thought leadership</option>
                  <option value="behind_the_scenes">Behind the scenes</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label>Tone</Label>
                <RadioGroup
                  value={state.tone}
                  onValueChange={(v) => setState({ ...state, tone: v as any })}
                  className="grid grid-cols-2 gap-2"
                >
                  {(["professional", "casual", "humorous", "urgent"] as Tone[]).map((opt) => (
                    <label
                      key={opt}
                      htmlFor={`tone-${opt}`}
                      className={cn(
                        "cursor-pointer rounded-md border p-2 text-sm capitalize transition",
                        "border-white/10 bg-white/5 hover:bg-white/10",
                        state.tone === opt && "border-violet-500/40 bg-violet-500/10",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem id={`tone-${opt}`} value={opt} />
                        <span>{opt.replace("_", " ")}</span>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Target platforms</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(["Instagram", "TikTok", "YouTube", "LinkedIn"] as Platform[]).map((p) => {
                  const checked = state.platforms.includes(p)
                  return (
                    <label
                      key={p}
                      htmlFor={`plat-${p}`}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm transition",
                        checked
                          ? "border-violet-500/40 bg-violet-500/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10",
                      )}
                    >
                      <Checkbox
                        id={`plat-${p}`}
                        checked={checked}
                        onCheckedChange={(v) => {
                          setState((s) => {
                            const next = new Set(s.platforms)
                            if (v) next.add(p)
                            else next.delete(p)
                            return { ...s, platforms: Array.from(next) as Platform[] }
                          })
                        }}
                      />
                      {p}
                    </label>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle>Script generation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {!state.script && !state.generating && (
              <div className="rounded-md border border-white/10 bg-white/5 p-4 text-sm text-white/80">
                Click “Generate script” to draft a first version. You can edit or regenerate anytime.
              </div>
            )}

            {state.generating && (
              <div className="flex items-center gap-3 rounded-md border border-white/10 bg-white/5 p-3 text-sm">
                <Loader2 className="size-4 animate-spin text-violet-300" />
                <div className="flex-1">
                  <p className="font-medium">AI is generating your script…</p>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded bg-white/10">
                    <div
                      className="h-1 rounded bg-gradient-to-r from-violet-500 to-indigo-500"
                      style={{ width: `${state.progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-white/60">{state.progress}%</span>
              </div>
            )}

            {state.script && (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80">
                    Estimated: {formatDuration(state.estimatedSeconds)}
                  </div>
                  <Button
                    variant="outline"
                    className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                    onClick={() =>
                      setState((s) => ({
                        ...s,
                        generating: true,
                        progress: 0,
                        script: "",
                        estimatedSeconds: 0,
                      }))
                    }
                  >
                    <RefreshCcw className="mr-2 size-4" />
                    Regenerate
                  </Button>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="script">Script (editable)</Label>
                  <Textarea
                    id="script"
                    className="min-h-[220px] bg-white/5 text-white placeholder:text-white/40"
                    value={state.script}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        script: e.target.value,
                        estimatedSeconds: estimateDuration(e.target.value),
                      }))
                    }
                  />
                </div>
              </>
            )}

            {!state.generating && !state.script && (
              <Button
                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500"
                onClick={() => setState((s) => ({ ...s, generating: true, progress: 0 }))}
              >
                <Sparkles className="mr-2 size-4" />
                Generate script
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle>Select a template</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={state.templateId ?? undefined}
              onValueChange={(v) => setState((s) => ({ ...s, templateId: v }))}
              className="grid gap-4 sm:grid-cols-2"
            >
              {templates.map((t) => {
                const selected = state.templateId === t.id
                return (
                  <label
                    key={t.id}
                    htmlFor={t.id}
                    className={cn(
                      "group relative overflow-hidden rounded-xl border transition",
                      selected
                        ? "border-violet-500/40 bg-violet-500/10"
                        : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                    )}
                  >
                    <input id={t.id} type="radio" className="sr-only" value={t.id} />
                    <div className="aspect-video w-full">
                      <img
                        src={t.img || "/placeholder.svg?height=720&width=1280&query=video%20template%20preview"}
                        alt={`${t.name} preview`}
                        className="h-full w-full object-cover opacity-90 transition duration-200 group-hover:scale-[1.02]"
                      />
                    </div>
                    <div className="flex items-center justify-between p-3">
                      <div>
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-white/60">Best for: {t.bestFor}</p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
                          selected
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : "border-white/15 bg-white/5 text-white/70",
                        )}
                      >
                        {selected ? "Selected" : "Choose"}
                      </span>
                    </div>
                  </label>
                )
              })}
            </RadioGroup>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle>Brand & Advanced Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="bg">Background color</Label>
                <Input
                  id="bg"
                  type="color"
                  value={state.brandBg}
                  onChange={(e) => setState({ ...state, brandBg: e.target.value })}
                  className="h-10 w-20 bg-transparent p-1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="text">Text color</Label>
                <Input
                  id="text"
                  type="color"
                  value={state.brandText}
                  onChange={(e) => setState({ ...state, brandText: e.target.value })}
                  className="h-10 w-20 bg-transparent p-1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="logo">Logo</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const url = URL.createObjectURL(file)
                    setState((s) => ({ ...s, logoFile: file, logoUrl: url }))
                  }}
                  className="bg-white/5 text-white file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white"
                />
              </div>
              <div className="grid gap-2">
                <Label>Logo placement</Label>
                <RadioGroup
                  value={state.logoPlacement}
                  onValueChange={(v) => setState((s) => ({ ...s, logoPlacement: v as any }))}
                  className="grid grid-cols-2 gap-2"
                >
                  {(["top-left", "top-right", "bottom-left", "bottom-right"] as LogoPlacement[]).map((pos) => (
                    <label
                      key={pos}
                      htmlFor={`pos-${pos}`}
                      className={cn(
                        "cursor-pointer rounded-md border p-2 text-sm capitalize transition",
                        "border-white/10 bg-white/5 hover:bg-white/10",
                        state.logoPlacement === pos && "border-violet-500/40 bg-violet-500/10",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem id={`pos-${pos}`} value={pos} />
                        <span>{pos.replace("-", " ")}</span>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Style</Label>
                <select
                  className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
                  value={state.style}
                  onChange={(e) => setState({ ...state, style: e.target.value as any })}
                >
                  <option value="cinematic">Cinematic</option>
                  <option value="realistic">Realistic</option>
                  <option value="animated">Animated</option>
                  <option value="corporate">Corporate</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Motion</Label>
                <select
                  className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
                  value={state.motion}
                  onChange={(e) => setState({ ...state, motion: e.target.value as any })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Camera movement</Label>
                <select
                  className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
                  value={state.camera_movement}
                  onChange={(e) => setState({ ...state, camera_movement: e.target.value as any })}
                >
                  <option value="static">Static</option>
                  <option value="pan">Pan</option>
                  <option value="zoom">Zoom</option>
                  <option value="tracking">Tracking</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Lighting</Label>
                <select
                  className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
                  value={state.lighting}
                  onChange={(e) => setState({ ...state, lighting: e.target.value as any })}
                >
                  <option value="natural">Natural</option>
                  <option value="studio">Studio</option>
                  <option value="dramatic">Dramatic</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Quality</Label>
                <select
                  className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
                  value={state.quality}
                  onChange={(e) => setState({ ...state, quality: e.target.value as any })}
                >
                  <option value="standard">Standard</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="variations">Variations</Label>
                <Input
                  id="variations"
                  type="number"
                  min={1}
                  max={6}
                  value={state.variationCount}
                  onChange={(e) =>
                    setState({ ...state, variationCount: Math.max(1, Math.min(6, Number(e.target.value) || 1)) })
                  }
                  className="bg-white/5 text-white"
                />
                <p className="text-xs text-white/50">Generate multiple versions to compare side-by-side.</p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="neg">Negative prompt (optional)</Label>
              <Input
                id="neg"
                placeholder="What to avoid (e.g., text artifacts, watermarks, distorted faces)…"
                value={state.negativePrompt}
                onChange={(e) => setState({ ...state, negativePrompt: e.target.value })}
                className="bg-white/5 text-white placeholder:text-white/40"
              />
            </div>

            <SmartSuggestions
              script={state.script}
              platforms={state.platforms}
              brandBg={state.brandBg}
              brandText={state.brandText}
              current={{
                durationSeconds: state.estimatedSeconds || 20,
                style: state.style,
                motion: state.motion,
                camera_movement: state.camera_movement,
                lighting: state.lighting,
                quality: state.quality,
              }}
              onApply={(patch) => {
                setState((s) => ({
                  ...s,
                  estimatedSeconds: patch.durationSeconds ?? s.estimatedSeconds,
                  style: (patch as any).style ?? s.style,
                  motion: (patch as any).motion ?? s.motion,
                  camera_movement: (patch as any).camera_movement ?? s.camera_movement,
                  lighting: (patch as any).lighting ?? s.lighting,
                  quality: (patch as any).quality ?? s.quality,
                }))
              }}
            />

            <AdvancedControls
              baseScript={state.script || generateMockScript(state.idea, state.videoType, state.tone, state.platforms)}
              negativePrompt={state.negativePrompt}
              variationCount={state.variationCount}
              currentOptions={{
                style: state.style,
                motion: state.motion,
                camera_movement: state.camera_movement,
                lighting: state.lighting,
                quality: state.quality,
              }}
              onChange={(patch) => {
                if (typeof patch.variationCount === "number")
                  setState((s) => ({ ...s, variationCount: patch.variationCount! }))
                if (typeof patch.negativePrompt === "string")
                  setState((s) => ({ ...s, negativePrompt: patch.negativePrompt! }))
                setAbPrompt((prev) => ({ ...prev, a: patch.scriptA ?? prev.a, b: patch.scriptB ?? prev.b }))
              }}
              onApplyOptions={(preset) => {
                setState((s) => ({
                  ...s,
                  style: preset.style,
                  motion: preset.motion,
                  camera_movement: preset.camera_movement,
                  lighting: preset.lighting,
                  quality: preset.quality,
                }))
              }}
            />

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
              <p className="mb-2 text-sm text-white/70">Preview</p>
              <div
                className="relative aspect-video w-full overflow-hidden rounded-lg"
                style={{ background: state.brandBg }}
              >
                <img
                  src={
                    templates.find((t) => t.id === state.templateId)?.img ||
                    "/placeholder.svg?height=720&width=1280&query=video%20template%20preview" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg"
                  }
                  alt="Template preview"
                  className="h-full w-full object-cover opacity-70"
                />
                {state.logoUrl && (
                  <img
                    src={state.logoUrl || "/placeholder.svg?height=80&width=80&query=logo%20preview"}
                    alt="Logo preview"
                    className={cn(
                      "absolute h-10 w-10 rounded bg-white/10 object-contain p-1",
                      state.logoPlacement === "top-left" && "left-3 top-3",
                      state.logoPlacement === "top-right" && "right-3 top-3",
                      state.logoPlacement === "bottom-left" && "left-3 bottom-3",
                      state.logoPlacement === "bottom-right" && "right-3 bottom-3",
                    )}
                  />
                )}
                <div className="absolute bottom-4 left-4 right-4">
                  <div
                    className="inline-block rounded-md px-3 py-2 text-sm"
                    style={{ background: "rgba(0,0,0,0.45)", color: state.brandText }}
                  >
                    {"Your caption appears here"}
                  </div>
                </div>
              </div>
            </div>

            <BrandCheck bg={state.brandBg} text={state.brandText} />
          </CardContent>
        </Card>
      )}

      {/* Footer actions */}
      <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="outline"
          className="border-white/15 bg-white/5 text-white hover:bg-white/10"
          onClick={onSaveDraft}
        >
          <Save className="mr-2 size-4" />
          Save as Draft
        </Button>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="text-white/80 hover:bg-white/10"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button
              disabled={!canNext()}
              onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
              className={cn(
                "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500",
                !canNext() && "opacity-60",
              )}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={onFinish}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500"
            >
              Create {state.variationCount > 1 ? "Videos" : "Video"}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        By continuing, you agree to our{" "}
        <Link href="#" className="text-violet-300 hover:text-violet-200">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="#" className="text-violet-300 hover:text-violet-200">
          Privacy Policy
        </Link>
        .
      </div>

      {/* Generation overlay */}
      <GenerationOverlay
        open={genOpen}
        onOpenChange={setGenOpen}
        request={genRequest ?? undefined}
        onSuccess={handleGenerationSuccess}
      />

      <PublishSheet
        open={publishOpen}
        onOpenChange={setPublishOpen}
        defaultCaption={state.idea.slice(0, 120)}
        videoUrl={lastVideoUrl}
      />
    </div>
  )
}
