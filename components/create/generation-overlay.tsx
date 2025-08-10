"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertTriangle, CircleCheck, X } from "lucide-react"
import { GenerationProgress } from "./generation-progress"
import { useOfflineQueue } from "@/hooks/use-offline-queue"
import { useNotifications } from "@/hooks/use-notifications"
import { RunwayErrorType, type RunwayError } from "@/types/runway-error"
import { recommendLowerQuality, suggestPromptFixes } from "@/lib/prompt-suggestions"

type RunwayJobStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED"

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
  negativePrompt?: string
  options: AdvancedRunwayOptions
  variationCount?: number
  autoRegenerateOnLowQuality?: boolean
  templateId?: string | null
  brand?: { primary?: string; secondary?: string; logoUrl?: string | null; font?: string | null } | null
}

export type RunwayJob = {
  id: string
  status: RunwayJobStatus
  progress?: number
  createdAt: string
  task: string
  output?: string[]
  etaMs?: number
  failure?: string
  failureCode?: string
  queue?: {
    position: number
    estimatedStartTime?: string | Date
    queueLength: number
    averageProcessingTime: number
  }
  stage?: string
  stageDescription?: string
}

function stageFor(job: RunwayJob) {
  if (job.stage) return job.stage
  if (job.status === "PENDING" || (job.progress ?? 0) < 10) return "Analyzing prompt..."
  if (job.status === "RUNNING" && (job.progress ?? 0) < 90) return "Generating video..."
  if (job.status === "RUNNING") return "Processing..."
  if (job.status === "SUCCEEDED") return "Completed"
  if (job.status === "FAILED") return "Failed"
  if (job.status === "CANCELLED") return "Cancelled"
  return "Working..."
}

function userFriendlyError(msg: string) {
  if (/quota/i.test(msg)) return "Daily video quota reached. Try again tomorrow or upgrade your plan."
  if (/rate.*limit|too many/i.test(msg)) return "You're moving fast! Please wait a moment and try again."
  if (/auth|unauthorized|api key/i.test(msg)) return "The video service is misconfigured. Please contact support."
  if (/unavailable|temporarily|timeout/i.test(msg))
    return "The video service is temporarily unavailable. Please try again shortly."
  if (/invalid|validation|policy/i.test(msg))
    return "Something in your prompt looks off. Adjust the prompt or parameters and retry."
  return msg
}

export function GenerationOverlay(props: {
  open: boolean
  onOpenChange: (v: boolean) => void
  request?: VideoCreationRequest | null
  onSuccess?: (jobs: RunwayJob[], urls: (string | null)[]) => void
}) {
  const { open, onOpenChange, request, onSuccess } = props
  const [jobs, setJobs] = React.useState<RunwayJob[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [phase, setPhase] = React.useState<"idle" | "creating" | "polling" | "done" | "error">("idle")
  const [creatingCost, setCreatingCost] = React.useState<number | null>(null)
  const startedRef = React.useRef(false)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const { enqueue, flush } = useOfflineQueue()
  const { supported: notifSupported, permission, requestPermission, notify } = useNotifications()

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const start = React.useCallback(async () => {
    if (!request) return
    setError(null)
    setPhase("creating")
    setJobs([])
    setCreatingCost(null)
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueue(request)
      setPhase("done")
      setJobs([])
      setError(null)
      setCreatingCost(null)
      return
    }
    try {
      const res = await fetch("/api/runway/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error?.userMessage || data.error || `Unable to create job`)
      const created: RunwayJob[] = data.jobs
      if (typeof data.estimatedCostCents === "number") setCreatingCost(data.estimatedCostCents)
      setJobs(created)
      setPhase("polling")
    } catch (e: any) {
      const offlineLike = e instanceof TypeError || (typeof navigator !== "undefined" && !navigator.onLine)
      if (offlineLike && request) {
        enqueue(request)
        setPhase("done")
        setJobs([])
        setError(null)
        return
      }
      const structured: RunwayError = {
        type: RunwayErrorType.UNKNOWN_ERROR,
        message: e?.message || "Failed to create job",
        userMessage: userFriendlyError(e?.message || "Failed to create job"),
        retryable: true,
        suggestedAction: "Retry the operation.",
      }
      setError(JSON.stringify(structured))
      setPhase("error")
    }
  }, [request, enqueue])

  const poll = React.useCallback(async () => {
    if (jobs.length === 0) return
    try {
      const results = await Promise.all(
        jobs.map(async (j) => {
          if (["SUCCEEDED", "FAILED", "CANCELLED"].includes(j.status)) return j
          const res = await fetch(`/api/runway/jobs/${j.id}`)
          const data = (await res.json()) as RunwayJob & { error?: any }
          if (!res.ok || data.error) throw new Error(data.error?.userMessage || `Polling failed`)
          return data
        }),
      )
      setJobs(results)
      const allDone = results.every((j) => ["SUCCEEDED", "FAILED", "CANCELLED"].includes(j.status))
      if (allDone) {
        setPhase("done")
        clearTimer()
        const urls = results.map((r) => r.output?.[0] || null)
        onSuccess?.(results, urls)
        if (notifSupported && permission !== "granted") void requestPermission()
        if (notifSupported) {
          const allOk = results.every((j) => j.status === "SUCCEEDED")
          notify(allOk ? "Your video is ready" : "Video generation finished", {
            body: allOk ? "Click to open the video." : "Some variations failed. Review in Jobs.",
          })
        }
      } else {
        const avgProgress =
          results.length === 0 ? 0 : Math.round(results.reduce((s, j) => s + (j.progress ?? 5), 0) / results.length)
        const nextDelay = Math.min(30_000, Math.max(1200, Math.round((100 - avgProgress) * 45)))
        timerRef.current = setTimeout(poll, nextDelay)
      }
    } catch {
      timerRef.current = setTimeout(poll, 5000)
    }
  }, [jobs, onSuccess, notifSupported, permission, requestPermission, notify])

  const cancelAll = React.useCallback(async () => {
    try {
      await Promise.all(jobs.map((j) => fetch(`/api/runway/jobs/${j.id}`, { method: "DELETE" })))
    } catch {
    } finally {
      clearTimer()
    }
  }, [jobs])

  React.useEffect(() => {
    if (open && request && !startedRef.current) {
      startedRef.current = true
      start()
    }
    if (!open) {
      startedRef.current = false
      setJobs([])
      setPhase("idle")
      setError(null)
      clearTimer()
    }
  }, [open, request, start])

  React.useEffect(() => {
    clearTimer()
    if (phase === "polling" && jobs.length > 0) {
      timerRef.current = setTimeout(poll, 1200)
    }
    return () => clearTimer()
  }, [phase, jobs, poll])

  React.useEffect(() => {
    if (open && typeof navigator !== "undefined" && navigator.onLine) {
      void flush(async (body) => {
        await fetch("/api/runway/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      })
    }
  }, [open, flush])

  const parsed: RunwayError | null = React.useMemo(() => {
    try {
      return error ? (JSON.parse(error) as RunwayError) : null
    } catch {
      return null
    }
  }, [error])

  const [retryCountdown, setRetryCountdown] = React.useState<number>(parsed?.retryAfterMs || 0)
  React.useEffect(() => {
    if (!parsed?.retryAfterMs) return
    setRetryCountdown(parsed.retryAfterMs)
    const id = setInterval(() => {
      setRetryCountdown((n) => (n <= 1000 ? 0 : n - 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [parsed?.retryAfterMs])

  const isWorking = phase === "creating" || phase === "polling"
  const errorTip = parsed?.userMessage || "Something went wrong."
  const suggestions = React.useMemo(() => {
    return suggestPromptFixes(request?.script || "", parsed?.message)
  }, [request?.script, parsed?.message])

  async function retryNow() {
    if (!request) return
    setPhase("creating")
    try {
      await start()
    } catch {}
  }

  async function retryLowerQuality() {
    if (!request) return
    const downgraded = recommendLowerQuality(request)
    try {
      await fetch("/api/runway/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(downgraded),
      })
      setPhase("creating")
      setError(null)
      setJobs([])
      startedRef.current = false
      start()
    } catch {}
  }

  function queueForLater() {
    if (!request) return
    enqueue(request)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-white/10 bg-white/[0.03]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {phase === "error" ? <AlertTriangle className="h-5 w-5 text-amber-300" /> : null}
            {phase === "done" && jobs.every((j) => j.status === "SUCCEEDED") ? (
              <CircleCheck className="h-5 w-5 text-emerald-400" />
            ) : null}
            Generate {jobs.length > 1 ? "Videos" : "Video"}
          </DialogTitle>
          <DialogDescription className="text-white/70">
            {phase === "error"
              ? "We hit a problem while creating your video."
              : "We’re creating your video. This usually takes 30–180 seconds depending on complexity."}
          </DialogDescription>
        </DialogHeader>

        {creatingCost != null && phase !== "done" && phase !== "error" ? (
          <div className="mb-3 text-xs text-white/70">Estimated cost: ${(creatingCost / 100).toFixed(2)}</div>
        ) : null}

        {phase === "done" && jobs.length === 0 && !error ? (
          <div className="rounded-md border border-blue-500/20 bg-blue-500/10 p-3 text-sm text-blue-200">
            You’re offline. Your generation request was queued and will submit automatically when you’re back online.
          </div>
        ) : null}

        {isWorking && jobs.length === 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting job…
            </div>
            <Progress value={12} />
          </div>
        ) : null}

        {isWorking && jobs.length > 0 ? (
          <div className="space-y-3">
            {jobs.map((j) => (
              <GenerationProgress
                key={j.id}
                jobId={j.id}
                status={j.status}
                progress={Math.min(99, j.progress ?? 5)}
                estimatedTimeRemaining={j.etaMs ?? 0}
                currentStage={j.stageDescription || stageFor(j)}
                queue={j.queue}
              />
            ))}
            <div className="flex items-center gap-2 text-xs text-white/60">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Please keep this dialog open until generation finishes.</span>
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" onClick={cancelAll} className="text-white/80 hover:bg-white/10">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        {phase === "error" && (
          <Alert variant="destructive" className="border-rose-500/20 bg-rose-500/10 text-rose-200">
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">
                  {parsed?.type ? parsed.type.replace(/_/g, " ").toLowerCase() : "error"}
                </div>
                <div>{errorTip}</div>
                <div className="text-rose-100/80 text-xs">{parsed?.message}</div>
                {parsed?.suggestedAction ? (
                  <div className="text-xs text-white/80">Suggested: {parsed.suggestedAction}</div>
                ) : null}
                {parsed?.type === RunwayErrorType.RATE_LIMIT_EXCEEDED && retryCountdown > 0 ? (
                  <div className="text-xs text-white/70">Recommended retry in ~{Math.ceil(retryCountdown / 1000)}s</div>
                ) : null}
                {suggestions.length > 0 ? (
                  <div className="mt-2">
                    <div className="mb-1 text-xs text-white/70">Prompt tips:</div>
                    <ul className="list-disc pl-5 text-xs space-y-1">
                      {suggestions.map((s, i) => (
                        <li key={i} className="opacity-90">
                          {s.length > 120 ? s.slice(0, 120) + "…" : s}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {phase === "done" && (
          <Alert className="border-emerald-500/20 bg-emerald-500/10 text-emerald-200">
            <AlertDescription>
              {jobs.every((j) => j.status === "SUCCEEDED")
                ? "Your video is ready!"
                : "Some variations did not complete. You can retry from the Jobs page."}
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-3 flex flex-wrap justify-end gap-2">
          {parsed?.retryable ? (
            <Button
              variant="outline"
              onClick={retryNow}
              disabled={parsed?.type === RunwayErrorType.RATE_LIMIT_EXCEEDED && retryCountdown > 0}
              className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            >
              {parsed?.type === RunwayErrorType.RATE_LIMIT_EXCEEDED && retryCountdown > 0
                ? `Retry in ${Math.ceil(retryCountdown / 1000)}s`
                : "Retry now"}
            </Button>
          ) : null}
          <Button
            variant="outline"
            onClick={retryLowerQuality}
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
          >
            Lower quality and retry
          </Button>
          <Button
            variant="outline"
            onClick={queueForLater}
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
          >
            Queue for later
          </Button>
          <a
            href="mailto:support@example.com?subject=Viral%20Video%20Maker%20Runway%20Issue"
            className="inline-flex h-9 items-center justify-center rounded-md border border-white/15 bg-white/5 px-3 text-sm text-white hover:bg-white/10"
          >
            Contact support
          </a>
        </div>

        {(phase === "done" || phase === "error") && (
          <div className="mt-3 flex justify-end gap-2">
            {phase === "error" ? (
              <Button
                variant="outline"
                onClick={() => {
                  if (request) start()
                }}
                className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                Retry
              </Button>
            ) : null}
            <Button onClick={() => onOpenChange(false)} className="bg-gradient-to-r from-violet-600 to-indigo-600">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
