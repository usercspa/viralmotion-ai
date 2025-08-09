"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type GenPrefs = {
  style: "cinematic" | "realistic" | "animated" | "corporate"
  motion: "low" | "medium" | "high"
  camera_movement: "static" | "pan" | "zoom" | "tracking"
  lighting: "natural" | "studio" | "dramatic"
  quality: "standard" | "high"
  negativePrompt: string
  variationCount: number
  notifyOnComplete: boolean
}

const STORAGE = "vvm:gen-prefs"
const defaults: GenPrefs = {
  style: "cinematic",
  motion: "medium",
  camera_movement: "static",
  lighting: "natural",
  quality: "standard",
  negativePrompt: "avoid text artifacts, avoid watermarks, avoid distorted hands/faces",
  variationCount: 1,
  notifyOnComplete: true,
}

export default function PreferencesPage() {
  const [prefs, setPrefs] = React.useState<GenPrefs>(defaults)
  const [saving, setSaving] = React.useState(false)
  const { toast } = useToast()

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE)
      if (raw) setPrefs({ ...defaults, ...JSON.parse(raw) })
    } catch {}
  }, [])

  async function save() {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))
    try {
      localStorage.setItem(STORAGE, JSON.stringify(prefs))
      toast({ title: "Preferences saved", description: "Defaults will be applied in the generator." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Preferences</h1>
      <Card className="border-white/10 bg-white/[0.03]">
        <CardHeader>
          <CardTitle>Default Generation Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Style</Label>
              <select
                value={prefs.style}
                onChange={(e) => setPrefs({ ...prefs, style: e.target.value as any })}
                className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
              >
                <option value="cinematic">Cinematic</option>
                <option value="realistic">Realistic</option>
                <option value="animated">Animated</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Motion</Label>
              <select
                value={prefs.motion}
                onChange={(e) => setPrefs({ ...prefs, motion: e.target.value as any })}
                className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Camera movement</Label>
              <select
                value={prefs.camera_movement}
                onChange={(e) => setPrefs({ ...prefs, camera_movement: e.target.value as any })}
                className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
              >
                <option value="static">Static</option>
                <option value="pan">Pan</option>
                <option value="zoom">Zoom</option>
                <option value="tracking">Tracking</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Lighting</Label>
              <select
                value={prefs.lighting}
                onChange={(e) => setPrefs({ ...prefs, lighting: e.target.value as any })}
                className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
              >
                <option value="natural">Natural</option>
                <option value="studio">Studio</option>
                <option value="dramatic">Dramatic</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Quality</Label>
              <select
                value={prefs.quality}
                onChange={(e) => setPrefs({ ...prefs, quality: e.target.value as any })}
                className="h-10 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white"
              >
                <option value="standard">Standard</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="variations">Default variations</Label>
              <Input
                id="variations"
                type="number"
                min={1}
                max={6}
                value={prefs.variationCount}
                onChange={(e) =>
                  setPrefs({ ...prefs, variationCount: Math.max(1, Math.min(6, Number(e.target.value))) })
                }
                className="bg-white/5 text-white"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="neg">Default negative prompt</Label>
            <Input
              id="neg"
              value={prefs.negativePrompt}
              onChange={(e) => setPrefs({ ...prefs, negativePrompt: e.target.value })}
              className="bg-white/5 text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="notify"
              checked={prefs.notifyOnComplete}
              onCheckedChange={(v) => setPrefs({ ...prefs, notifyOnComplete: Boolean(v) })}
            />
            <Label htmlFor="notify">Notify me when jobs complete</Label>
          </div>

          <Button
            onClick={save}
            disabled={saving}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Preferences
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
