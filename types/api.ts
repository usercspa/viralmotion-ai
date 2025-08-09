// Shared domain types for the services

export type Platform = "Instagram" | "TikTok" | "YouTube" | "LinkedIn" | "Facebook" | "Twitter"

export type RangeKey = "7d" | "30d" | "90d"

export type ContentType = "product_demo" | "thought_leadership" | "behind_the_scenes" | "announcement"

export type GenerateScriptRequest = {
  idea: string
  videoType: "product_demo" | "thought_leadership" | "behind_the_scenes"
  tone: "professional" | "casual" | "humorous" | "urgent"
  platforms: Platform[]
}

export type GenerateScriptResponse = {
  script: string
  estimatedSeconds: number
}

export type StartVideoJobRequest = {
  templateId: string
  brand: {
    primary: string
    secondary: string
    logoUrl?: string | null
    font: string
  }
  script: string
}

export type StartVideoJobResponse = {
  jobId: string
  status: "queued"
}

export type JobStatus =
  | { jobId: string; status: "queued" | "processing"; progress: number }
  | { jobId: string; status: "completed"; url: string; thumbnail: string }
  | { jobId: string; status: "failed"; error: string }

export type PublishRequest = {
  videoId: string
  platforms: Platform[]
  captions: Record<Platform, string>
  schedule?: { date: string; time: string } | null
}

export type PublishResponse = {
  statuses: Record<Platform, "success" | "failed" | "queued">
}

export type TrendingHashtagsResponse = { hashtag: string; score: number }[]
export type TrendingAudioResponse = { id: string; title: string; artist: string; usageScore: number }[]
export type TrendingTopicsResponse = { topic: string; growth: number }[]

export type AnalyticsOverviewResponse = {
  totalVideos: number
  totalViews: number
  engagementRate: number
  bestPlatform: Platform
}

export type TimeSeriesPoint = { date: string; views: number }
export type PlatformPerformance = { platform: Platform; views: number }
export type ContentTypeSplit = { type: ContentType; value: number }

export type VideoRow = {
  id: string
  title: string
  thumbnail: string
  publishDate: string
  platforms: Platform[]
  views: number
  likes: number
  comments: number
  shares: number
  engagementRate: number
  type: ContentType
}
