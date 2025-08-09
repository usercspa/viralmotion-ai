import { NextResponse } from "next/server"
import { RunwayAPIService } from "@/services/runway-api"
import { RunwayVideoGenerationService } from "@/services/video-generation"

let runwayService: RunwayAPIService | null = null
let genService: RunwayVideoGenerationService | null = null
function getServices() {
  if (!runwayService) runwayService = new RunwayAPIService()
  if (!genService) genService = new RunwayVideoGenerationService(runwayService)
  return { runwayService, genService }
}

export async function POST(req: Request) {
  try {
    const { jobId } = (await req.json()) as { jobId: string }
    const { runwayService, genService } = getServices()
    const job = await runwayService.getJob(jobId)
    const report = await genService.qualityCheck(job)
    return NextResponse.json({ report })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Quality check failed" }, { status: e?.status || 500 })
  }
}
