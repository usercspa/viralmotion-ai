"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { usePresets } from "@/hooks/use-presets"

export default function TeamTemplatesPage() {
  const { presets, removePreset } = usePresets()
  const [filter, setFilter] = React.useState("")

  const list = presets.filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()))

  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Team Templates</h1>
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Shared Presets</CardTitle>
          <div className="w-60">
            <Input
              placeholder="Search presets…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-white/5 text-white placeholder:text-white/40"
            />
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {list.length === 0 ? <div className="text-sm text-white/70">No presets found.</div> : null}
          {list.map((p) => (
            <div key={p.id} className="rounded-md border border-white/10 bg-white/5 p-3">
              <div className="text-sm font-medium">{p.name}</div>
              <div className="text-xs text-white/70">{p.description || "—"}</div>
              <div className="mt-2 text-[11px] text-white/60">
                {p.style} · {p.quality} · {p.motion} · {p.lighting}
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="outline" size="sm" className="border-white/15 bg-white/5 text-white">
                  Share
                </Button>
                <Button variant="outline" size="sm" onClick={() => removePreset(p.id)}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-6 rounded-md border border-white/10 bg-white/5 p-3">
        <div className="text-xs text-white/70">
          Tip: Use “Save current settings as preset” in the generator to build your shared library.
        </div>
      </div>
    </div>
  )
}
