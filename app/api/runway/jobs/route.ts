import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getRunwayService } from "@/services/runway-service-singleton"
import type { RunwayVideoRequest } from "@/services/runway-api"
import { getRunwayJobManager } from "@/services/runway-job-manager"

// Identify user by cookie (session)
function getOwnerId(): string {
  const jar = cookies()
  let id = jar.get("vvm_owner_id")?.value
  if (!id) {
    id = crypto.randomUUID()
    jar.set("vvm_owner_id", id, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 })
  }
  return id
}

// List active jobs for current user
export async function GET() {
  try {
    const ownerId = getOwnerId()
    const service = getRunwayService()
    const jobs = service.listActiveJobs(ownerId)
    return NextResponse.json({ jobs })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to list jobs" }, { status: e?.status || 500 })
  }
}

// Create a new Runway job
export async function POST(req: Request) {
  try {
    const ownerId = getOwnerId()
    const body = (await req.json()) as RunwayVideoRequest
    const service = getRunwayService()
    const job = await service.submitVideoJob(body, ownerId)
    getRunwayJobManager().startPolling(job.id)
    return NextResponse.json(job)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to create job" }, { status: e?.status || 500 })
  }
}
