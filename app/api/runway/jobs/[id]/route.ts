import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getRunwayService } from "@/services/runway-service-singleton"
import { mapUnknownErrorToRunwayError } from "@/lib/runway-error-mapper"

function getOwnerId(): string {
  const jar = cookies()
  let id = jar.get("vvm_owner_id")?.value
  if (!id) {
    id = crypto.randomUUID()
    jar.set("vvm_owner_id", id, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 })
  }
  return id
}

// GET job status
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const service = getRunwayService()
    const job = await service.getJob(params.id)
    return NextResponse.json(job)
  } catch (e: any) {
    const error = mapUnknownErrorToRunwayError(e)
    return NextResponse.json({ error }, { status: error.status || 500 })
  }
}

// DELETE (cancel) job
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const service = getRunwayService()
    const job = await service.cancelJob(params.id)
    return NextResponse.json(job)
  } catch (e: any) {
    const error = mapUnknownErrorToRunwayError(e)
    return NextResponse.json({ error }, { status: error.status || 500 })
  }
}
