import { BaseAPIService } from "./base"
import type {
  AnalyticsOverviewResponse,
  ContentTypeSplit,
  PlatformPerformance,
  RangeKey,
  TimeSeriesPoint,
  VideoRow,
} from "@/types/api"

function formatDate(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export class MockAnalyticsService extends BaseAPIService {
  async getOverview(range: RangeKey): Promise<AnalyticsOverviewResponse> {
    return this.doRequest(async () => {
      await new Promise((r) => setTimeout(r, 250))
      const mult = range === "7d" ? 1 : range === "30d" ? 3 : 6
      return {
        totalVideos: 12 * mult,
        totalViews: 125_000 * mult,
        engagementRate: 12.8,
        bestPlatform: "YouTube",
      }
    })
  }

  async getTimeSeries(range: RangeKey): Promise<TimeSeriesPoint[]> {
    return this.doRequest(async () => {
      const days = range === "7d" ? 7 : range === "30d" ? 30 : 90
      await new Promise((r) => setTimeout(r, 260))
      const arr: TimeSeriesPoint[] = []
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const base = 1500 + Math.round(Math.random() * 1500)
        const trend = Math.round((days - i) * (Math.random() * 20))
        const views = base + trend + Math.round(Math.sin(i / 3) * 200)
        arr.push({ date: formatDate(d), views: Math.max(300, views) })
      }
      return arr
    })
  }

  async getPlatformPerformance(range: RangeKey): Promise<PlatformPerformance[]> {
    return this.doRequest(async () => {
      const mult = range === "7d" ? 1 : range === "30d" ? 3 : 6
      await new Promise((r) => setTimeout(r, 200))
      return [
        { platform: "Instagram", views: 42000 * mult },
        { platform: "TikTok", views: 38000 * mult },
        { platform: "YouTube", views: 56000 * mult },
        { platform: "LinkedIn", views: 18000 * mult },
      ]
    })
  }

  async getContentTypeSplit(): Promise<ContentTypeSplit[]> {
    return this.doRequest(async () => {
      await new Promise((r) => setTimeout(r, 180))
      return [
        { type: "product_demo", value: 38 },
        { type: "thought_leadership", value: 27 },
        { type: "behind_the_scenes", value: 21 },
        { type: "announcement", value: 14 },
      ]
    })
  }

  async getVideoTable(range: RangeKey): Promise<VideoRow[]> {
    return this.doRequest(async () => {
      await new Promise((r) => setTimeout(r, 300))
      const base: VideoRow[] = [
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
      ]
      const days = range === "7d" ? 7 : range === "30d" ? 30 : 90
      return base.filter((v) => new Date(v.publishDate) >= new Date(Date.now() - days * 86400000))
    })
  }
}
