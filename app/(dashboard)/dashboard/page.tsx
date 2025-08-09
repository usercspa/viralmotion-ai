"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowUpRight, Loader2, Sparkles } from "lucide-react"
import Link from "next/link"

type VideoStatus = "published" | "generating" | "draft"
type Video = {
  id: string
  title: string
  status: VideoStatus
  duration: string
  thumbnail: string
}

const mockVideos: Video[] = [
  {
    id: "vid-1",
    title: "How to launch your MVP in 7 days",
    status: "published",
    duration: "0:28",
    thumbnail: "/video-thumbnail-concept.png?height=720&width=1280&query=thumbnail%201",
  },
  {
    id: "vid-2",
    title: "Our AI cuts your editing time by 90%",
    status: "generating",
    duration: "0:34",
    thumbnail: "/video-thumbnail-concept.png?height=720&width=1280&query=thumbnail%202",
  },
  {
    id: "vid-3",
    title: "Top 3 hooks for product videos",
    status: "draft",
    duration: "0:21",
    thumbnail: "/video-thumbnail-concept.png?height=720&width=1280&query=thumbnail%203",
  },
  {
    id: "vid-4",
    title: "Why short-form drives conversions",
    status: "published",
    duration: "0:31",
    thumbnail: "/video-thumbnail-concept.png?height=720&width=1280&query=thumbnail%204",
  },
]

const analytics = {
  totalVideos: 42,
  totalViews: 128_450,
  engagementRate: 12.8,
}

const topics = [
  { label: "AI Tools", growth: "+28%" },
  { label: "Startup Tips", growth: "+17%" },
  { label: "Productivity", growth: "+12%" },
  { label: "E-commerce", growth: "+22%" },
  { label: "Marketing Hooks", growth: "+31%" },
  { label: "Founders Stories", growth: "+9%" },
]

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [selectedTopic, setSelectedTopic] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/sign-in")
    }
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      {/* Welcome + CTA */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Welcome back{user?.name ? `, ${user.name}` : ""} 👋</h1>
          <p className="text-sm text-muted-foreground">Create, edit, and publish videos with your brand kit.</p>
        </div>
        <Button
          onClick={() => router.push("/create")}
          className="group bg-gradient-to-r from-violet-600 to-indigo-600 text-white transition-transform hover:scale-[1.02] hover:from-violet-500 hover:to-indigo-500"
        >
          <Sparkles className="mr-2 size-4" />
          Create New Video
          <ArrowUpRight className="ml-2 size-4 opacity-80 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{analytics.totalVideos}</div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{analytics.totalViews.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Engagement rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{analytics.engagementRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Content grid: recent videos + trending */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent videos</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/videos">View all</Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {mockVideos.slice(0, 4).map((v) => (
              <Link
                key={v.id}
                href={`/videos/${v.id}`}
                className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] transition hover:-translate-y-0.5"
              >
                <div className="aspect-video w-full bg-white/5">
                  <img
                    src={v.thumbnail || "/placeholder.svg"}
                    alt={`${v.title} thumbnail`}
                    className="h-full w-full object-cover opacity-90 transition duration-200 group-hover:scale-[1.02]"
                  />
                </div>
                <div className="flex items-center justify-between p-3">
                  <div>
                    <p className="line-clamp-1 text-sm font-medium">{v.title}</p>
                    <p className="text-xs text-muted-foreground"> {v.duration}</p>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Trending topics */}
        <aside>
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Trending topics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topics.map((t) => {
                const active = selectedTopic === t.label
                return (
                  <button
                    key={t.label}
                    onClick={() => setSelectedTopic((prev) => (prev === t.label ? null : t.label))}
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition ${
                      active
                        ? "border-violet-500/40 bg-violet-500/10"
                        : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05]"
                    }`}
                  >
                    <span className="text-sm">{t.label}</span>
                    <span className="text-xs text-emerald-400">{t.growth}</span>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: VideoStatus }) {
  const map: Record<VideoStatus, { label: string; className: string; icon?: React.ReactNode }> = {
    published: { label: "Published", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
    generating: {
      label: "Generating",
      className: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      icon: <Loader2 className="mr-1 size-3 animate-spin" />,
    },
    draft: { label: "Draft", className: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
  }

  const v = map[status]
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${v.className}`}
      aria-label={`Status: ${v.label}`}
    >
      {v.icon}
      {v.label}
    </span>
  )
}
