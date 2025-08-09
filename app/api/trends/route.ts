import { NextResponse } from "next/server"

// Simple in-app trends for prompt optimization.
// In production, connect to your trends service or provider.

export async function GET() {
  const topics = [
    { topic: "AIShortcuts", growth: 38 },
    { topic: "BuildInPublic", growth: 26 },
    { topic: "DayInTheLife", growth: 19 },
    { topic: "BeforeAfter", growth: 41 },
    { topic: "FounderTips", growth: 22 },
  ]
  return NextResponse.json({ topics })
}
