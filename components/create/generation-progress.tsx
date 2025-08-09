"use client"
import { Progress } from "@/components/ui/progress"
import { Timer, Users } from "lucide-react"
import { cn } from "@/lib/utils"

export type RunwayJobStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED"

export interface GenerationProgressProps {
  jobId: string
  status: RunwayJobStatus
  progress: number
  estimatedTimeRemaining: number
  currentStage: string
  queue?: {
    position: number
    estimatedStartTime?: string | Date
    queueLength: number
    averageProcessingTime: number
  }
  className?: string
}

function formatETA(ms?: number) {
  if (!ms || ms <= 0) return "—"
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
  className,
}: GenerationProgressProps) {
  const isDone = ["SUCCEEDED", "FAILED", "CANCELLED"].includes(status)
  const barValue = Math.min(100, Math.max(0, isDone && status === "SUCCEEDED" ? 100 : progress || 5))

  return (
    <div
      className={cn(
        "rounded-md border border-white/10 bg-white/5 p-3 sm:p-4",
        "transition-[transform,opacity] duration-300",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs sm:text-sm font-medium">Job {jobId.slice(0, 8)}</div>
        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-white/60">
          <Timer className="h-3.5 w-3.5" />
          <span>ETA {formatETA(estimatedTimeRemaining)}</span>
          {queue ? (
            <span className="hidden sm:inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              Queue {queue.position + 1}/{queue.queueLength}
            </span>
          ) : null}
        </div>
      </div>
      <div className="mt-1 text-[11px] sm:text-xs text-white/70">{currentStage}</div>
      <Progress className="mt-2 h-2 sm:h-2.5" value={barValue} />
      {queue?.estimatedStartTime ? (
        <div className="mt-2 text-[10px] text-white/50">
          Starts around {new Date(queue.estimatedStartTime).toLocaleTimeString()}
        </div>
      ) : null}
    </div>
  )
}
