"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertTriangle, CircleCheck, X } from "lucide-react"
import { GenerationProgress } from "./generation-progress"

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
  if (/invalid|validation/i.test(msg))
    return "Something in your request looks off. Adjust the prompt or parameters and retry."
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
    try {
      // Ask server to create job(s); server can also return cost estimate snapshot
      const res = await fetch("/api/runway/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || `Unable to create job (status ${res.status})`)
      const created: RunwayJob[] = data.jobs
      if (typeof data.estimatedCostCents === "number") setCreatingCost(data.estimatedCostCents)
      setJobs(created)
      setPhase("polling")
    } catch (e) {
      setError(userFriendlyError(e instanceof Error ? e.message : "Failed to create job"))
      setPhase("error")
    }
  }, [request])

  const poll = React.useCallback(async () => {
    if (jobs.length === 0) return
    try {
      const results = await Promise.all(
        jobs.map(async (j) => {
          if (["SUCCEEDED", "FAILED", "CANCELLED"].includes(j.status)) return j
          const res = await fetch(`/api/runway/jobs/${j.id}`)
          const data = (await res.json()) as RunwayJob & { error?: string }
          if (!res.ok || data.error) throw new Error(data.error || `Polling failed ${res.status}`)
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
      } else {
        const avgProgress =
          results.length === 0 ? 0 : Math.round(results.reduce((s, j) => s + (j.progress ?? 5), 0) / results.length)
        const nextDelay = Math.min(30_000, Math.max(1200, Math.round((100 - avgProgress) * 45)))
        timerRef.current = setTimeout(poll, nextDelay)
      }
    } catch (e) {
      // retry on transient error
      timerRef.current = setTimeout(poll, 5000)
    }
  }, [jobs, onSuccess])

  const cancelAll = React.useCallback(async () => {
    try {
      await Promise.all(jobs.map((j) => fetch(`/api/runway/jobs/${j.id}`, { method: "DELETE" })))
    } catch {
      // ignore
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

  const isWorking = phase === "creating" || phase === "polling"

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

        {phase === "done" && (
          <Alert className="border-emerald-500/20 bg-emerald-500/10 text-emerald-200">
            <AlertDescription>
              {jobs.every((j) => j.status === "SUCCEEDED")
                ? "Your video is ready!"
                : "Some variations did not complete. You can retry from the Jobs page."}
            </AlertDescription>
          </Alert>
        )}

        {phase === "error" && (
          <Alert variant="destructive" className="border-rose-500/20 bg-rose-500/10 text-rose-200">
            <AlertDescription>{error || "Something went wrong."}</AlertDescription>
          </Alert>
        )}

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
