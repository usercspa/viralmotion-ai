"use client"

import * as React from "react"
import { useToast } from "@/hooks/use-toast"

export type JobStatus = "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELLED"
export type JobQueueStatus = {
  position: number
  estimatedStartTime: string | Date
  queueLength: number
  averageProcessingTime: number
}
export type RunwayJob = {
  id: string
  status: JobStatus
  progress?: number
  createdAt: string
  task: string
  output?: string[]
  etaMs?: number
  failure?: string
  failureCode?: string
  queue?: JobQueueStatus
  stage?: string
  stageDescription?: string
}

type MapTimers = Map<string, ReturnType<typeof setTimeout>>

function delayFromProgress(progress?: number) {
  const p = typeof progress === "number" ? progress : 5
  return Math.max(1200, Math.min(30_000, Math.round((100 - p) * 45)))
}

export function useJobTracker() {
  const [jobs, setJobs] = React.useState<RunwayJob[]>([])
  const [loading, setLoading] = React.useState(false)
  const timers = React.useRef<MapTimers>(new Map())
  const { toast } = useToast()

  const clearTimer = (id: string) => {
    const t = timers.current.get(id)
    if (t) {
      clearTimeout(t)
      timers.current.delete(id)
    }
  }
  const clearAll = () => {
    for (const t of timers.current.values()) clearTimeout(t)
    timers.current.clear()
  }

  const fetchList = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/runway/jobs")
      const data = (await res.json()) as { jobs?: RunwayJob[]; error?: string }
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`)
      setJobs(data.jobs || [])
      ;(data.jobs || []).forEach((j) => {
        if (!["SUCCEEDED", "FAILED", "CANCELLED"].includes(j.status)) {
          schedulePoll(j.id, 1200)
        }
      })
    } catch {
      // ignore initial errors
    } finally {
      setLoading(false)
    }
  }, [])

  const schedulePoll = React.useCallback(
    (id: string, delay: number) => {
      clearTimer(id)
      const t = setTimeout(async () => {
        try {
          const res = await fetch(`/api/runway/jobs/${id}`)
          const data = (await res.json()) as RunwayJob & { error?: string }
          if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`)
          setJobs((prev) => prev.map((j) => (j.id === id ? data : j)))
          if (["SUCCEEDED", "FAILED", "CANCELLED"].includes(data.status)) {
            clearTimer(id)
            if (data.status === "SUCCEEDED") {
              toast({ title: "Video ready", description: "Your generated video has finished." })
            } else if (data.status === "FAILED") {
              toast({
                title: "Generation failed",
                description: data.failure || "There was a problem generating your video.",
                variant: "destructive",
              })
            }
          } else {
            schedulePoll(id, delayFromProgress(data.progress))
          }
        } catch {
          schedulePoll(id, 5000)
        }
      }, delay)
      timers.current.set(id, t)
    },
    [toast],
  )

  const cancel = React.useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/runway/jobs/${id}`, { method: "DELETE" })
        const data = (await res.json()) as RunwayJob & { error?: string }
        if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`)
        clearTimer(id)
        setJobs((prev) => prev.map((j) => (j.id === id ? data : j)))
      } catch {
        toast({ title: "Could not cancel", description: "Please try again.", variant: "destructive" })
      }
    },
    [toast],
  )

  const retry = React.useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/runway/jobs/${id}/retry`, { method: "POST" })
        const data = (await res.json()) as RunwayJob & { error?: string }
        if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`)
        setJobs((prev) => [data, ...prev])
        schedulePoll(data.id, 1200)
      } catch {
        toast({ title: "Could not retry", description: "Please try again later.", variant: "destructive" })
      }
    },
    [toast, schedulePoll],
  )

  React.useEffect(() => {
    const onOnline = () => {
      toast({ title: "Back online", description: "Resuming job updates." })
      jobs.forEach((j) => {
        if (!["SUCCEEDED", "FAILED", "CANCELLED"].includes(j.status)) schedulePoll(j.id, 1200)
      })
    }
    const onOffline = () => {
      toast({ title: "Offline", description: "We’ll retry when you’re back online." })
      clearAll()
    }
    window.addEventListener("online", onOnline)
    window.addEventListener("offline", onOffline)
    return () => {
      window.removeEventListener("online", onOnline)
      window.removeEventListener("offline", onOffline)
    }
  }, [jobs, schedulePoll, toast])

  React.useEffect(() => {
    fetchList()
    return () => clearAll()
  }, [fetchList])

  return { jobs, loading, cancel, retry, refresh: fetchList }
}
