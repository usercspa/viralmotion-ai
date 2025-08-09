"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type MemberUsage = {
  name: string
  videos: number
  seconds: number
  costCents: number
}

export default function TeamUsagePage() {
  const [data] = React.useState<MemberUsage[]>([
    { name: "Alex", videos: 12, seconds: 640, costCents: 745 },
    { name: "Sam", videos: 8, seconds: 420, costCents: 512 },
    { name: "Jamie", videos: 15, seconds: 880, costCents: 989 },
  ])

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Team Usage & Billing</h1>
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-base">Usage by Team Member</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {data.map((m) => (
            <div key={m.name} className="rounded-md border border-white/10 bg-white/5 p-3 text-sm">
              <div className="font-medium">{m.name}</div>
              <div className="mt-1 text-white/70">{m.videos} videos</div>
              <div className="text-white/70">{m.seconds}s generated</div>
              <div className="text-white/70">${(m.costCents / 100).toFixed(2)} est.</div>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="mt-6 rounded-md border border-white/10 bg-white/5 p-3 text-xs text-white/70">
        Centralized billing: export usage by member and period (coming soon).
      </div>
    </div>
  )
}
