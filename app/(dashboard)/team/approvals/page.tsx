"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type Pending = {
  id: string
  title: string
  requestedBy: string
  createdAt: string
  url?: string | null
}

export default function ApprovalsPage() {
  const [items, setItems] = React.useState<Pending[]>(() => {
    // Seed from localStorage videos as "pending approval" examples
    try {
      const raw = localStorage.getItem("vvm:videos")
      const arr = raw ? JSON.parse(raw) : []
      return (arr as any[])
        .slice(0, 4)
        .map((v) => ({ id: v.id, title: v.title, requestedBy: "Teammate", createdAt: v.createdAt, url: v.url || null }))
    } catch {
      return []
    }
  })

  function approve(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function requestChanges(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Team Approvals</h1>
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Pending Reviews</CardTitle>
          <Badge variant="secondary">{items.length}</Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? <div className="text-sm text-white/70">No items waiting for approval.</div> : null}
          {items.map((i) => (
            <div key={i.id} className="rounded-md border border-white/10 bg-white/5 p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{i.title}</div>
                <div className="text-xs text-white/60">{new Date(i.createdAt).toLocaleString()}</div>
              </div>
              {i.url ? (
                <video className="mt-2 w-full rounded" src={i.url} controls preload="metadata" playsInline />
              ) : null}
              <div className="mt-3 flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => requestChanges(i.id)}>
                  Request changes
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-violet-600 to-indigo-600"
                  onClick={() => approve(i.id)}
                >
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
