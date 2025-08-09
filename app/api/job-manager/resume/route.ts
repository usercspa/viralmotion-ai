import { NextResponse } from "next/server"
import { getRunwayJobManager } from "@/services/runway-job-manager"

export async function POST() {
  try {
    const count = getRunwayJobManager().resumeAllInProgress()
    return NextResponse.json({ started: count })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to resume" }, { status: e?.status || 500 })
  }
}
