import { NextResponse } from "next/server"
import { getErrorAnalytics } from "@/lib/error-analytics"

export async function GET() {
  try {
    const analytics = getErrorAnalytics()
    return NextResponse.json(analytics)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load error analytics" }, { status: 500 })
  }
}
