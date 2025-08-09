import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { listTemplates, saveTemplate, deleteTemplate } from "@/lib/templates-store"
import { getJob as getStoredJob } from "@/lib/job-store"

function getOwnerId(): string {
  const jar = cookies()
  let id = jar.get("vvm_owner_id")?.value
  if (!id) {
    id = crypto.randomUUID()
    jar.set("vvm_owner_id", id, { httpOnly: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 365 })
  }
  return id
}

export async function GET() {
  const ownerId = getOwnerId()
  return NextResponse.json({ templates: listTemplates(ownerId) })
}

export async function POST(req: Request) {
  const ownerId = getOwnerId()
  const body = await req.json().catch(() => ({}))
  // Two modes: save from jobId or provide raw template
  if (body.jobId) {
    const rec = getStoredJob(body.jobId)
    if (!rec || rec.ownerId !== ownerId) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }
    const name = body.name || `Template ${rec.job.id.slice(0, 6)}`
    const tpl = saveTemplate(ownerId, name, rec.req as any)
    return NextResponse.json({ template: tpl })
  } else if (body.name && body.request) {
    const tpl = saveTemplate(ownerId, body.name, body.request)
    return NextResponse.json({ template: tpl })
  }
  return NextResponse.json({ error: "Invalid body" }, { status: 400 })
}

export async function DELETE(req: Request) {
  const ownerId = getOwnerId()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id") || ""
  const ok = deleteTemplate(ownerId, id)
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}
