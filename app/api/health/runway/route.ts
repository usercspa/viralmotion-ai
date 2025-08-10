import { NextResponse } from "next/server"
import { checkRunwayHealth } from "@/lib/network-health"

export async function GET() {
  const health = await checkRunwayHealth()
  return NextResponse.json(health)
}
