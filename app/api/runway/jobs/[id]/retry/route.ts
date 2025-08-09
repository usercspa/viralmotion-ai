import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getRunwayService } from "@/services/runway-service-singleton"
import { getRunwayJobManager } from "@/services/runway-job-manager"

function getOwnerId(): string {
  const jar = cookies()
  let id = jar.get("vvm_owner_id")?.value
  if (!id) {
    id = crypto.randomUUID()
    jar.set("vvm_owner_id", id, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 })
  }
  return id
}

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    const ownerId = getOwnerId()
    const service = getRunwayService()
    const job = await service.retryJob(params.id, ownerId)
    getRunwayJobManager().startPolling(job.id)
    return NextResponse.json(job)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to retry job" }, { status: e?.status || 500 })
  }
}
