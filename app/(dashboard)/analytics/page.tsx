"use client"

import * as React from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  BarChart3,
  Calendar,
  FileText,
  Instagram,
  Linkedin,
  Music2,
  Share2,
  TrendingUp,
  Youtube,
  Eye,
  Send,
  Trash2,
  RefreshCcw,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type RangeKey = "7d" | "30d" | "90d"
type Platform = "Instagram" | "TikTok" | "YouTube" | "LinkedIn"
type ContentType = "product_demo" | "thought_leadership" | "behind_the_scenes" | "announcement"

type VideoRow = {
  id: string
  title: string
  thumbnail: string
  publishDate: string // ISO
  platforms: Platform[]
  views: number
  likes: number
  comments: number
  shares: number
  engagementRate: number // %
  type: ContentType
}

const platformColors: Record<Platform, string> = {
  Instagram: "#E1306C",
  TikTok: "#29B6F6",
  YouTube: "#FF0000",
  LinkedIn: "#0A66C2",
}

const contentTypeLabels: Record<ContentType, string> = {
  product_demo: "Product Demo",
  thought_leadership: "Thought Leadership",
  behind_the_scenes: "Behind the Scenes",
  announcement: "Announcement",
}

function formatNumber(n: number) {
  return n.toLocaleString()
}

function formatShort(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return `${n}`
}

function dateDaysAgo(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

// Mock base data
const baseVideos: VideoRow[] = [
  {
    id: "vid-101",
    title: "MVP in 7 Days: The Fast Track",
    thumbnail: "/video-thumbnail-concept.png?height=720&width=1280&query=mvp%207%20days",
    publishDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    platforms: ["Instagram", "YouTube"],
    views: 28450,
    likes: 3120,
    comments: 245,
    shares: 310,
    engagementRate: 14.2,
    type: "thought_leadership",
  },
  {
    id: "vid-102",
    title: "Product Demo: 3 Clicks to Convert",
    thumbnail: "/video-thumbnail-concept.png?height=720&width=1280&query=product%20demo",
    publishDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    platforms: ["Instagram", "TikTok", "YouTube"],
    views: 40410,
    likes: 4210,
    comments: 410,
    shares: 515,
    engagementRate: 12.6,
    type: "product_demo",
  },
  {
    id: "vid-103",
    title: "Behind the Scenes: Our Content Setup",
    thumbnail: "/video-thumbnail-concept.png?height=720&width=1280&query=behind%20the%20scenes",
    publishDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 23).toISOString(),
    platforms: ["TikTok", "Instagram"],
    views: 19870,
    likes: 2300,
    comments: 190,
    shares: 240,
    engagementRate: 8.9,
    type: "behind_the_scenes",
  },
  {
    id: "vid-104",
    title: "New Feature Announcement: Autocaptions",
    thumbnail: "/video-thumbnail-concept.png?height=720&width=1280&query=announcement",
    publishDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35).toISOString(),
    platforms: ["LinkedIn", "YouTube"],
    views: 12230,
    likes: 980,
    comments: 120,
    shares: 110,
    engagementRate: 6.1,
    type: "announcement",
  },
]

// Mock time series factory (views per day)
function generateTimeSeries(days: number) {
  const arr: { date: string; views: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = dateDaysAgo(i)
    const base = 1500 + Math.round(Math.random() * 1500)
    const trend = Math.round((days - i) * (Math.random() * 20))
    const views = base + trend + Math.round(Math.sin(i / 3) * 200)
    arr.push({ date: formatDate(d), views: Math.max(300, views) })
  }
  return arr
}

// Mock platform performance
function generatePlatformStats(range: RangeKey) {
  const mult = range === "7d" ? 1 : range === "30d" ? 3 : 6
  return [
    { platform: "Instagram" as Platform, views: 42000 * mult },
    { platform: "TikTok" as Platform, views: 38000 * mult },
    { platform: "YouTube" as Platform, views: 56000 * mult },
    { platform: "LinkedIn" as Platform, views: 18000 * mult },
  ]
}

// Mock content type split
function generateContentTypeSplit() {
  return [
    { type: "product_demo" as ContentType, value: 38 },
    { type: "thought_leadership" as ContentType, value: 27 },
    { type: "behind_the_scenes" as ContentType, value: 21 },
    { type: "announcement" as ContentType, value: 14 },
  ]
}

export default function AnalyticsPage() {
  const { toast } = useToast()
  const [range, setRange] = React.useState<RangeKey>("7d")
  const [videos, setVideos] = React.useState<VideoRow[]>(baseVideos)

  // Derived
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90
  const ts = React.useMemo(() => generateTimeSeries(days), [days])
  const platforms = React.useMemo(() => generatePlatformStats(range), [range])
  const typeSplit = React.useMemo(() => generateContentTypeSplit(), [])
  const totals = React.useMemo(() => {
    const inRangeVideos = videos.filter((v) => {
      const d = new Date(v.publishDate)
      return d >= dateDaysAgo(days)
    })
    const totalVideos = inRangeVideos.length
    const totalViews = inRangeVideos.reduce((a, b) => a + b.views, 0)
    const avgEng = inRangeVideos.length
      ? inRangeVideos.reduce((a, b) => a + b.engagementRate, 0) / inRangeVideos.length
      : 0
    const bestPlatform = platforms.slice().sort((a, b) => b.views - a.views)[0]?.platform ?? "YouTube"
    return { totalVideos, totalViews, avgEng: Number(avgEng.toFixed(1)), bestPlatform }
  }, [videos, range, platforms, days])

  function exportReport() {
    const headers = [
      "Title",
      "Publish Date",
      "Platforms",
      "Views",
      "Likes",
      "Comments",
      "Shares",
      "Engagement Rate (%)",
    ]
    const rows = videos
      .filter((v) => new Date(v.publishDate) >= dateDaysAgo(days))
      .map((v) => [
        `"${v.title.replace(/"/g, '""')}"`,
        new Date(v.publishDate).toISOString().slice(0, 10),
        v.platforms.join("|"),
        v.views,
        v.likes,
        v.comments,
        v.shares,
        v.engagementRate,
      ])
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics_${range}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast({ title: "Report exported", description: "Your CSV download has started." })
  }

  async function shareDashboard() {
    const shareData = {
      title: "Viral Video Maker Analytics",
      text: "Check out our latest analytics dashboard.",
      url: typeof window !== "undefined" ? window.location.href : "",
    }
    try {
      if ("share" in navigator) {
        // @ts-expect-error
        await navigator.share(shareData)
        toast({ title: "Shared", description: "Dashboard link shared successfully." })
      } else {
        await navigator.clipboard.writeText(shareData.url)
        toast({ title: "Link copied", description: "Dashboard URL copied to clipboard." })
      }
    } catch {}
  }

  function deleteVideo(id: string) {
    setVideos((prev) => prev.filter((v) => v.id !== id))
    toast({ title: "Deleted", description: "Video removed from analytics list." })
  }

  function engColor(er: number) {
    if (er >= 12) return "text-emerald-300"
    if (er >= 6) return "text-amber-300"
    return "text-red-300"
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-white/80" />
          <h1 className="text-xl font-semibold">Analytics</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <SelectTrigger className="w-[180px] border-white/15 bg-white/5 text-white">
              <Calendar className="mr-2 size-4 opacity-70" />
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            onClick={exportReport}
          >
            <FileText className="mr-2 size-4" />
            Export Report
          </Button>
          <Button
            variant="outline"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            onClick={shareDashboard}
          >
            <Share2 className="mr-2 size-4" />
            Share Dashboard
          </Button>
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Total Videos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totals.totalVideos}</div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{formatNumber(totals.totalViews)}</div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Avg. Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-semibold", engColor(totals.avgEng))}>{totals.avgEng}%</div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/80">Best Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <PlatformIcon platform={totals.bestPlatform as Platform} />
              <div className="text-2xl font-semibold">{totals.bestPlatform}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-white/80">Views over time</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ts}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} tickMargin={8} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} />
                <RTooltip
                  contentStyle={{
                    background: "rgba(15,15,20,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "white",
                  }}
                />
                <Line type="monotone" dataKey="views" stroke="#e11d48" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-white/80">Views by platform</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platforms}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="platform" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} tickMargin={8} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} />
                <RTooltip
                  contentStyle={{
                    background: "rgba(15,15,20,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "white",
                  }}
                  formatter={(v: any) => [formatNumber(v), "Views"]}
                />
                <Bar dataKey="views" radius={[6, 6, 0, 0]}>
                  {platforms.map((p, idx) => (
                    <Cell key={p.platform} fill={platformColors[p.platform]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-white/80">Content type performance</CardTitle>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeSplit} dataKey="value" nameKey="type" innerRadius={50} outerRadius={90} paddingAngle={3}>
                  {typeSplit.map((s, idx) => (
                    <Cell key={s.type} fill={["#e11d48", "#10b981", "#f59e0b", "#6366f1"][idx % 4]} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value: ContentType) => contentTypeLabels[value]}
                  wrapperStyle={{ color: "rgba(255,255,255,0.8)" }}
                />
                <RTooltip
                  contentStyle={{
                    background: "rgba(15,15,20,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8,
                    color: "white",
                  }}
                  formatter={(v: any, n: ContentType) => [`${v}%`, contentTypeLabels[n]]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Table + Insights */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-white/10 bg-white/[0.03]">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-white/80">Video performance</CardTitle>
            <Button
              variant="outline"
              className="h-8 border-white/15 bg-white/5 text-white hover:bg-white/10"
              onClick={() =>
                toast({
                  title: "Content refreshed",
                  description: "Latest performance data loaded.",
                })
              }
            >
              <RefreshCcw className="mr-2 size-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead>Video</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Platforms</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Likes</TableHead>
                  <TableHead className="text-right">Comments</TableHead>
                  <TableHead className="text-right">Shares</TableHead>
                  <TableHead className="text-right">Engagement</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos
                  .filter((v) => new Date(v.publishDate) >= dateDaysAgo(days))
                  .map((v) => (
                    <TableRow key={v.id} className="border-white/10">
                      <TableCell className="min-w-[220px]">
                        <div className="flex items-center gap-3">
                          <div className="size-12 overflow-hidden rounded border border-white/10 bg-white/5">
                            <img
                              src={v.thumbnail || "/placeholder.svg"}
                              alt={`${v.title} thumbnail`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="line-clamp-1 text-sm font-medium">{v.title}</div>
                            <div className="text-xs text-white/60">{contentTypeLabels[v.type]}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(v.publishDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {v.platforms.map((p) => (
                            <PlatformBadge key={p} platform={p} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatShort(v.views)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatShort(v.likes)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatShort(v.comments)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatShort(v.shares)}</TableCell>
                      <TableCell className={cn("text-right font-medium", engColor(v.engagementRate))}>
                        {v.engagementRate}%
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" asChild>
                            <Link href={`/videos/${v.id}`} aria-label="View">
                              <Eye className="size-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white hover:bg-white/10"
                            onClick={() =>
                              toast({
                                title: "Queued for republish",
                                description: "We’ll open the publish flow on the editor.",
                              })
                            }
                          >
                            <Send className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-300 hover:bg-red-500/10"
                            onClick={() => deleteVideo(v.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card className="border-white/10 bg-white/[0.03]">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-white/80">Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <section>
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="size-4 text-emerald-300" />
                <h3 className="text-sm font-medium">Top Performing Content</h3>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center justify-between">
                  <span>Thought leadership</span>
                  <span className="text-emerald-300">+18% views</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Product demos</span>
                  <span className="text-emerald-300">+12% CTR</span>
                </li>
              </ul>
            </section>

            <section>
              <div className="mb-2 flex items-center gap-2">
                <Calendar className="size-4 text-white/80" />
                <h3 className="text-sm font-medium">Recommended Posting Times</h3>
              </div>
              <ul className="space-y-1 text-sm text-white/80">
                <li>Mon–Thu, 11:00–13:00</li>
                <li>Tue–Fri, 18:00–20:00</li>
                <li>Sun, 09:00–11:00</li>
              </ul>
            </section>

            <section>
              <div className="mb-2 flex items-center gap-2">
                <HashtagIcon />
                <h3 className="text-sm font-medium">Trending Hashtags</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {["#startup", "#growth", "#marketing", "#ai", "#shorts", "#ugc"].map((h) => (
                  <Badge key={h} variant="secondary" className="border-white/10 bg-white/10 text-white">
                    {h}
                  </Badge>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-2 flex items-center gap-2">
                <BarChart3 className="size-4 text-white/80" />
                <h3 className="text-sm font-medium">Content Suggestions</h3>
              </div>
              <ul className="space-y-2 text-sm">
                <li>Post 2–3 thought leadership clips weekly focusing on founder FAQs.</li>
                <li>Adapt product demos to YouTube Shorts; highest completion rates observed.</li>
                <li>Double down on Instagram carousels paired with short video hooks.</li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  if (platform === "Instagram")
    return <Instagram className={cn("size-4", className)} color={platformColors.Instagram} />
  if (platform === "YouTube") return <Youtube className={cn("size-4", className)} color={platformColors.YouTube} />
  if (platform === "LinkedIn") return <Linkedin className={cn("size-4", className)} color={platformColors.LinkedIn} />
  // TikTok (use music icon as stand-in)
  return <Music2 className={cn("size-4", className)} color={platformColors.TikTok} />
}

function PlatformBadge({ platform }: { platform: Platform }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs text-white/90"
      style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)" }}
      aria-label={platform}
    >
      <PlatformIcon platform={platform} />
      {platform}
    </span>
  )
}

function HashtagIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 text-white/80">
      <path
        fill="currentColor"
        d="M10 4h2l-.5 4h3l.5-4h2l-.5 4H20v2h-3.2l-.6 4H20v2h-4.2l-.5 4h-2l.5-4h-3l-.5 4H8l.5-4H4v-2h4.2l.6-4H4V8h4.2l.5-4Zm1 6-.6 4h3l.6-4h-3Z"
      />
    </svg>
  )
}
