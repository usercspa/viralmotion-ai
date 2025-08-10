"use client"

import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Timer } from "lucide-react"

export type RunwayJobStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED"

export interface GenerationProgressProps {
  jobId: string
  status: RunwayJobStatus
  progress: number
  estimatedTimeRemaining: number // ms
  currentStage: string
  queue?: {
    position: number
    estimatedStartTime?: string | Date
    queueLength: number
    averageProcessingTime: number
  }
}

function fmtETA(ms: number) {
  if (!ms || ms < 0) return "—"
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}m ${r}s`
}

export function GenerationProgress({
  jobId,
  status,
  progress,
  estimatedTimeRemaining,
  currentStage,
  queue,
}: GenerationProgressProps) {
  return (
    <div className="space-y-3 rounded-md border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium">Job {jobId.slice(0, 8)}</span>
          <Badge
            variant="secondary"
            className={
              status === "RUNNING"
                ? "bg-fuchsia-600 hover:bg-fuchsia-600"
                : status === "PENDING"
                  ? "bg-slate-600 hover:bg-slate-600"
                  : status === "SUCCEEDED"
                    ? "bg-emerald-600 hover:bg-emerald-600"
                    : status === "FAILED"
                      ? "bg-rose-600 hover:bg-rose-600"
                      : "bg-slate-700 hover:bg-slate-700"
            }
          >
            {status}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-white/70">
          <Timer className="h-4 w-4" />
          <span>ETA {fmtETA(estimatedTimeRemaining)}</span>
        </div>
      </div>
      <div className="text-sm text-white/80">{currentStage}</div>
      <Progress value={Math.min(99, progress ?? 5)} className="h-2" />
      {queue ? (
        <div className="text-[11px] text-white/60">
          Queue {queue.position + 1}/{queue.queueLength}
          {queue.estimatedStartTime ? ` • Starts ~ ${new Date(queue.estimatedStartTime).toLocaleTimeString()}` : ""} •
          Avg {Math.round(queue.averageProcessingTime / 1000)}s
        </div>
      ) : null}
    </div>
  )
}
