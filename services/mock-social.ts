import { BaseAPIService } from "./base"
import type { PublishRequest, PublishResponse, Platform } from "@/types/api"

export class MockSocialMediaService extends BaseAPIService {
  async publish(req: PublishRequest): Promise<PublishResponse> {
    return this.doRequest(async () => {
      // Simulate per-platform outcomes
      await new Promise((r) => setTimeout(r, 800))
      const statuses = req.platforms.reduce(
        (acc, p) => {
          const roll = Math.random()
          acc[p] = roll < 0.08 ? "failed" : roll < 0.2 ? "queued" : "success"
          return acc
        },
        {} as Record<Platform, "success" | "failed" | "queued">,
      )
      return { statuses }
    })
  }

  async connect(platform: Platform): Promise<{ connected: true; username: string }> {
    return this.doRequest(async () => {
      await new Promise((r) => setTimeout(r, 600))
      const username = platform === "LinkedIn" ? "Your Brand" : "@yourbrand"
      return { connected: true, username }
    })
  }

  async disconnect(platform: Platform): Promise<{ disconnected: true }> {
    return this.doRequest(async () => {
      await new Promise((r) => setTimeout(r, 300))
      return { disconnected: true }
    })
  }
}
