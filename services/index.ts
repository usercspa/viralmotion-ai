import { usingMocks } from "@/lib/env"
import type {
  GenerateScriptRequest,
  GenerateScriptResponse,
  StartVideoJobRequest,
  StartVideoJobResponse,
  JobStatus,
  TrendingHashtagsResponse,
  TrendingAudioResponse,
  TrendingTopicsResponse,
  PublishRequest,
  PublishResponse,
  AnalyticsOverviewResponse,
  TimeSeriesPoint,
  PlatformPerformance,
  ContentTypeSplit,
  VideoRow,
  RangeKey,
  Platform,
} from "@/types/api"
import { MockVideoGenerationService } from "./mock-video-generation"
import { MockTrendService } from "./mock-trend"
import { MockSocialMediaService } from "./mock-social"
import { MockAnalyticsService } from "./mock-analytics"

// Interfaces (contracts) for services so we can swap mock vs real implementations.

export interface IVideoGenerationService {
  generateScript(payload: GenerateScriptRequest): Promise<GenerateScriptResponse>
  startVideoJob(req: StartVideoJobRequest): Promise<StartVideoJobResponse>
  getJobStatus(jobId: string): Promise<JobStatus>
}

export interface ITrendService {
  getTrendingHashtags(industry: string): Promise<TrendingHashtagsResponse>
  getTrendingAudio(): Promise<TrendingAudioResponse>
  getTrendingTopics(): Promise<TrendingTopicsResponse>
}

export interface ISocialMediaService {
  publish(req: PublishRequest): Promise<PublishResponse>
  connect(platform: Platform): Promise<{ connected: true; username: string }>
  disconnect(platform: Platform): Promise<{ disconnected: true }>
}

export interface IAnalyticsService {
  getOverview(range: RangeKey): Promise<AnalyticsOverviewResponse>
  getTimeSeries(range: RangeKey): Promise<TimeSeriesPoint[]>
  getPlatformPerformance(range: RangeKey): Promise<PlatformPerformance[]>
  getContentTypeSplit(): Promise<ContentTypeSplit[]>
  getVideoTable(range: RangeKey): Promise<VideoRow[]>
}

export type Services = {
  video: IVideoGenerationService
  trends: ITrendService
  social: ISocialMediaService
  analytics: IAnalyticsService
}

let singleton: Services | null = null

export function createServices(): Services {
  if (singleton) return singleton
  if (usingMocks()) {
    singleton = {
      video: new MockVideoGenerationService({
        rateLimit: { maxPerInterval: 8, intervalMs: 1000, key: "video" },
        retry: { retries: 2, baseDelayMs: 250, factor: 2, jitter: true },
      }),
      trends: new MockTrendService({
        rateLimit: { maxPerInterval: 10, intervalMs: 1000, key: "trends" },
        retry: { retries: 2 },
      }),
      social: new MockSocialMediaService({
        rateLimit: { maxPerInterval: 5, intervalMs: 1000, key: "social" },
        retry: { retries: 1 },
      }),
      analytics: new MockAnalyticsService({
        rateLimit: { maxPerInterval: 10, intervalMs: 1000, key: "analytics" },
        retry: { retries: 1 },
      }),
    }
  } else {
    // Placeholder for real implementations: instantiate real services here.
    singleton = {
      video: new MockVideoGenerationService(),
      trends: new MockTrendService(),
      social: new MockSocialMediaService(),
      analytics: new MockAnalyticsService(),
    }
  }
  return singleton
}
