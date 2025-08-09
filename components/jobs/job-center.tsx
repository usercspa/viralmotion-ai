"use client"

import { useJobTracker } from "@/hooks/use-job-tracker"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, Timer, XCircle, RefreshCcw, Play, Save } from "lucide-react"
import Link from "next/link"
import * as React from "react"

function formatETA(ms?: number) {
  if (!ms || ms <= 0) return "—"
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}m ${r}s`
}

export function JobCenter() {
  const { jobs, loading, cancel, retry, refresh } = useJobTracker()
  const [savingId, setSavingId] = React.useState<string | null>(null)

  const inProgress = jobs.filter((j) => !["SUCCEEDED", "FAILED", "CANCELLED"].includes(j.status))
  const done = jobs.filter((j) => ["SUCCEEDED", "FAILED", "CANCELLED"].includes(j.status))

  async function saveTemplate(jobId: string) {
    try {
      setSavingId(jobId)
      await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, name: `Template ${jobId.slice(0, 6)}` }),
      })
    } catch {
      // ignore
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Video Generation Jobs</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">In Progress</CardTitle>
          <Badge variant="secondary">{inProgress.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && inProgress.length === 0 ? (
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : null}
          {inProgress.length === 0 && !loading ? (
            <div className="text-sm text-white/70">No active jobs. Start a new generation to see it here.</div>
          ) : null}
          {inProgress.map((j) => (
            <div key={j.id} className="rounded-md border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Job {j.id.slice(0, 8)}</div>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <Timer className="h-3.5 w-3.5" />
                  <span>ETA {formatETA(j.etaMs)}</span>
                  {j.queue ? (
                    <span className="ml-2">
                      Queue {j.queue.position + 1}/{j.queue.queueLength}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="mt-2 text-xs text-white/70">
                {j.stage || (j.status === "PENDING" ? "Analyzing prompt…" : "Generating video…")}
              </div>
              <Progress className="mt-2 h-2" value={Math.min(99, j.progress ?? 5)} />
              <div className="mt-2 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => cancel(j.id)} className="text-white/80">
                  <XCircle className="mr-1.5 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">History</CardTitle>
          <Badge variant="secondary">{done.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {done.length === 0 ? (
            <div className="text-sm text-white/70">You’ll see completed and failed jobs here.</div>
          ) : null}
          {done.map((j) => (
            <div key={j.id} className="rounded-md border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Badge
                    className={
                      j.status === "SUCCEEDED"
                        ? "bg-emerald-600 hover:bg-emerald-600"
                        : j.status === "FAILED"
                          ? "bg-rose-600 hover:bg-rose-600"
                          : "bg-slate-600 hover:bg-slate-600"
                    }
                  >
                    {j.status}
                  </Badge>
                  <span className="font-medium">Job {j.id.slice(0, 8)}</span>
                </div>
                <div className="text-xs text-white/60">{new Date(j.createdAt).toLocaleString()}</div>
              </div>
              {j.status === "FAILED" && j.failure ? (
                <div className="mt-1 text-xs text-rose-200/90">{j.failure}</div>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                {j.status === "SUCCEEDED" && j.output?.[0] ? (
                  <Link href={j.output[0]} target="_blank">
                    <Button size="sm" className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                      <Play className="mr-1.5 h-4 w-4" />
                      View Video
                    </Button>
                  </Link>
                ) : null}
                {j.status !== "SUCCEEDED" ? (
                  <Button size="sm" variant="outline" onClick={() => retry(j.id)}>
                    <RefreshCcw className="mr-1.5 h-4 w-4" />
                    Retry
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => saveTemplate(j.id)}
                  disabled={savingId === j.id}
                  className="border-white/15 bg-white/5 text-white"
                >
                  <Save className="mr-1.5 h-4 w-4" />
                  {savingId === j.id ? "Saving..." : "Save as template"}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
