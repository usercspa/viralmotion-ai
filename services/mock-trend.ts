import { BaseAPIService } from "./base"
import type { TrendingHashtagsResponse, TrendingAudioResponse, TrendingTopicsResponse } from "@/types/api"

export class MockTrendService extends BaseAPIService {
  async getTrendingHashtags(industry: string): Promise<TrendingHashtagsResponse> {
    return this.doRequest(async () => {
      await new Promise((r) => setTimeout(r, 250))
      const seed = industry.toLowerCase()
      const base = ["#startup", "#growth", "#marketing", "#ai", "#shorts", "#ugc", "#founders", "#content"]
      return base
        .map((h, i) => ({ hashtag: h, score: Math.round(50 + Math.random() * 50) }))
        .sort((a, b) => b.score - a.score)
    })
  }

  async getTrendingAudio(): Promise<TrendingAudioResponse> {
    return this.doRequest(async () => {
      await new Promise((r) => setTimeout(r, 220))
      return [
        { id: "t1", title: "Night Drive", artist: "Noir Labs", usageScore: 88 },
        { id: "t2", title: "Neon Lights", artist: "Citywave", usageScore: 81 },
        { id: "t3", title: "Momentum", artist: "Flux", usageScore: 77 },
        { id: "t4", title: "Uplift", artist: "Falcon", usageScore: 73 },
      ]
    })
  }

  async getTrendingTopics(): Promise<TrendingTopicsResponse> {
    return this.doRequest(async () => {
      await new Promise((r) => setTimeout(r, 200))
      return [
        { topic: "AI Tools", growth: 28 },
        { topic: "Startup Tips", growth: 17 },
        { topic: "E-commerce", growth: 22 },
        { topic: "Marketing Hooks", growth: 31 },
        { topic: "Founder Stories", growth: 9 },
      ]
    })
  }
}
