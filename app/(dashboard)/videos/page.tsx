"use client"

import * as React from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, Play, RefreshCcw, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

type VideoItem = {
  id: string
  title: string
  status: "ready" | "generating" | "error" | "draft"
  duration: string
  thumbnail: string
  createdAt: string
  url?: string | null
  jobId?: string
  provider?: string
  state?: any
}

export default function VideosIndex() {
  const [items, setItems] = React.useState<VideoItem[]>([])
  const [query, setQuery] = React.useState("")
  const [status, setStatus] = React.useState<string>("all")
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("vvm:videos")
      const arr = (raw ? JSON.parse(raw) : []) as VideoItem[]
      setItems(arr)
    } catch {
      setItems([])
    }
  }, [])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function removeSelected() {
    const remaining = items.filter((i) => !selected.has(i.id))
    setItems(remaining)
    try {
      localStorage.setItem("vvm:videos", JSON.stringify(remaining))
    } catch {}
    setSelected(new Set())
  }

  function downloadSelected() {
    items
      .filter((i) => selected.has(i.id) && i.url)
      .forEach((i) => {
        const a = document.createElement("a")
        a.href = i.url!
        a.download = `${i.title.replace(/\s+/g, "-")}.mp4`
        document.body.appendChild(a)
        a.click()
        a.remove()
      })
  }

  const filtered = items.filter((i) => {
    const q = query.trim().toLowerCase()
    const matchesQ = !q || i.title.toLowerCase().includes(q)
    const matchesS = status === "all" || i.status === status
    return matchesQ && matchesS
  })

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-semibold">My Videos</h1>
        <Input
          placeholder="Search videos…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-64 bg-white text-black placeholder:text-neutral-500"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-md border border-white/10 bg-white/5 px-2 text-sm text-white"
        >
          <option value="all">All</option>
          <option value="ready">Ready</option>
          <option value="generating">Generating</option>
          <option value="error">Error</option>
          <option value="draft">Draft</option>
        </select>
        <Button
          variant="outline"
          disabled={selected.size === 0}
          onClick={downloadSelected}
          className="border-white/15 bg-white/5 text-white hover:bg-white/10"
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
        <Button
          variant="outline"
          disabled={selected.size === 0}
          onClick={removeSelected}
          className="border-white/15 bg-white/5 text-white hover:bg-white/10"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((v) => (
          <div
            key={v.id}
            className={cn(
              "group relative overflow-hidden rounded-xl border transition",
              "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
            )}
          >
            <div className="absolute left-2 top-2 z-10">
              <Checkbox checked={selected.has(v.id)} onCheckedChange={() => toggle(v.id)} />
            </div>
            <Link href={`/videos/${v.id}`} className="block">
              <div className="aspect-video w-full">
                <img
                  src={
                    v.thumbnail ||
                    "/placeholder.svg?height=720&width=1280&query=video%20thumbnail%20preview" ||
                    "/placeholder.svg" ||
                    "/placeholder.svg"
                  }
                  alt={`${v.title} thumbnail`}
                  className="h-full w-full object-cover opacity-90 transition duration-200 group-hover:scale-[1.02]"
                />
              </div>
            </Link>
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{v.title}</div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    v.status === "ready"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                      : v.status === "generating"
                        ? "border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-300"
                        : v.status === "draft"
                          ? "border-white/15 bg-white/10 text-white/80"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-300",
                  )}
                >
                  {v.status}
                </span>
              </div>
              <div className="mt-1 text-xs text-white/60">
                {v.duration} • {new Date(v.createdAt).toLocaleDateString()}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Link href={`/videos/${v.id}`}>
                  <Button size="sm" className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                    <Play className="mr-1.5 h-4 w-4" />
                    Open
                  </Button>
                </Link>
                {v.url ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault()
                      const a = document.createElement("a")
                      a.href = v.url!
                      a.download = `${v.title.replace(/\s+/g, "-")}.mp4`
                      document.body.appendChild(a)
                      a.click()
                      a.remove()
                    }}
                    className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                  >
                    <Download className="mr-1.5 h-4 w-4" />
                    Download
                  </Button>
                ) : null}
                {v.jobId ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => (window.location.href = "/jobs")}
                    className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                  >
                    <RefreshCcw className="mr-1.5 h-4 w-4" />
                    Check Job
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
