import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getQueueSnapshot } from "@/lib/queue"

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
  try {
    getOwnerId() // ensure session
    return NextResponse.json(getQueueSnapshot())
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load queue" }, { status: e?.status || 500 })
  }
}
