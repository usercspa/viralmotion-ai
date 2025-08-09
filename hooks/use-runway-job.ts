"use client"

import * as React from "react"
import type { RunwayVideoRequest, RunwayVideoJob } from "@/services/runway-api"

type State =
  | { phase: "idle"; job?: undefined; error?: undefined }
  | { phase: "creating"; job?: undefined; error?: undefined }
  | { phase: "polling"; job: RunwayVideoJob; error?: undefined; backoffMs: number }
  | { phase: "done"; job: RunwayVideoJob; error?: undefined }
  | { phase: "error"; error: string; job?: RunwayVideoJob }

export function useRunwayJob() {
  const [state, setState] = React.useState<State>({ phase: "idle" })
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const backoffRef = React.useRef<number>(1500)

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const schedulePoll = (jobId: string) => {
    const delay = Math.min(backoffRef.current, 30000)
    timerRef.current = setTimeout(async () => {
      try {
        const st = await fetch(`/api/runway/jobs/${jobId}`)
        const cur = (await st.json()) as RunwayVideoJob | { error: string }
        if ("error" in cur) throw new Error(cur.error)
        if (cur.status === "SUCCEEDED" || cur.status === "FAILED" || cur.status === "CANCELLED") {
          setState({ phase: "done", job: cur })
          clearTimer()
        } else {
          // increase backoff slightly if still running
          backoffRef.current = Math.min(Math.round(backoffRef.current * 1.6), 30000)
          setState({ phase: "polling", job: cur, backoffMs: backoffRef.current })
          schedulePoll(cur.id)
        }
      } catch (e) {
        clearTimer()
        const msg = e instanceof Error ? e.message : "Polling error"
        setState({ phase: "error", error: msg })
      }
    }, delay)
  }

  const createJob = React.useCallback(async (req: RunwayVideoRequest) => {
    setState({ phase: "creating" })
    clearTimer()
    backoffRef.current = 1500
    try {
      const res = await fetch("/api/runway/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || `Failed to create job (${res.status})`)
      const job = data as RunwayVideoJob
      setState({ phase: "polling", job, backoffMs: backoffRef.current })
      schedulePoll(job.id)
    } catch (e) {
      setState({
        phase: "error",
        error:
          e instanceof Error
            ? userFriendlyCreateError(e.message)
            : "We couldn't start the video. Please try again.",
      })
    }
  }, [])

  const cancel = React.useCallback(async () => {
    const job = state.phase === "polling" || state.phase === "done" ? state.job : undefined
    if (!job) return
    try {
      await fetch(`/api/runway/jobs/${job.id}`, { method: "DELETE" })
    } catch {
      // ignore
    } finally {
      clearTimer()
    }
  }, [state])

  React.useEffect(() => {
    return () => clearTimer()
  }, [])

  return {
    state,
    createJob,
    cancel,
    isLoading: state.phase === "creating" || state.phase === "polling",
    error: state.phase === "error" ? state.error : undefined,
    job: state.phase === "polling" || state.phase === "done" ? state.job : undefined,
  }
}

function userFriendlyCreateError(msg: string) {
  if (/quota/i.test(msg)) return "Daily video quota reached. Try again tomorrow or upgrade your plan."
  if (/rate.*limit|too many/i.test(msg)) return "You're moving fast! Please wait a moment and try again."
  if (/auth|unauthorized|api key/i.test(msg)) return "The video service is misconfigured. Please contact support."
  if (/unavailable|temporarily/i.test(msg)) return "The video service is temporarily unavailable. Please try again shortly."
  if (/invalid|validation/i.test(msg)) return "Something in your request looks off. Adjust the prompt or parameters and retry."
  return msg
}
