"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { usePresets } from "@/hooks/use-presets"
import type { Preset } from "@/types/premium"
import { Plus, Copy, ChevronRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export type AdvancedControlsProps = {
  baseScript: string
  negativePrompt?: string
  variationCount: number
  currentOptions: {
    style: "cinematic" | "realistic" | "animated" | "corporate"
    motion: "low" | "medium" | "high"
    camera_movement: "static" | "pan" | "zoom" | "tracking"
    lighting: "natural" | "studio" | "dramatic"
    quality: "standard" | "high"
  }
  onChange: (
    patch: Partial<{ variationCount: number; negativePrompt: string; scriptA: string; scriptB: string }>,
  ) => void
  onApplyOptions?: (preset: Preset) => void
}

export function AdvancedControls({
  baseScript,
  negativePrompt,
  variationCount,
  currentOptions,
  onChange,
  onApplyOptions,
}: AdvancedControlsProps) {
  const { presets, addPreset, removePreset } = usePresets()
  const [scriptA, setScriptA] = React.useState(baseScript)
  const [scriptB, setScriptB] = React.useState(`${baseScript}\n\nCTA: Comment "DEMO" if you want the checklist.`)

  React.useEffect(() => {
    setScriptA(baseScript)
  }, [baseScript])

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader>
        <CardTitle className="text-base">Advanced Generation Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <Tabs defaultValue="ab" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ab">A/B Prompts</TabsTrigger>
            <TabsTrigger value="batch">Batch</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
          </TabsList>

          <TabsContent value="ab" className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-white/10 bg-white/5 p-3">
                <div className="mb-1 text-xs text-white/70">Prompt A</div>
                <Textarea
                  value={scriptA}
                  onChange={(e) => {
                    setScriptA(e.target.value)
                    onChange({ scriptA: e.target.value })
                  }}
                  className="min-h-[160px] bg-white/5 text-white placeholder:text-white/40"
                  placeholder="Enter prompt A"
                />
              </div>
              <div className="rounded-md border border-white/10 bg-white/5 p-3">
                <div className="mb-1 flex items-center justify-between text-xs text-white/70">
                  <span>Prompt B</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-white/80 hover:bg-white/10"
                    onClick={() => {
                      setScriptB(scriptA)
                      onChange({ scriptB: scriptA })
                    }}
                  >
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    Copy A ➜ B
                  </Button>
                </div>
                <Textarea
                  value={scriptB}
                  onChange={(e) => {
                    setScriptB(e.target.value)
                    onChange({ scriptB: e.target.value })
                  }}
                  className="min-h-[160px] bg-white/5 text-white placeholder:text-white/40"
                  placeholder="Enter prompt B"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-1.5">
                <Label htmlFor="neg">Negative prompt</Label>
                <Input
                  id="neg"
                  value={negativePrompt || ""}
                  onChange={(e) => onChange({ negativePrompt: e.target.value })}
                  placeholder="Avoid text artifacts, watermarks…"
                  className="bg-white/5 text-white placeholder:text-white/40"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="var">Variations</Label>
                <Input
                  id="var"
                  type="number"
                  min={1}
                  max={6}
                  value={variationCount}
                  onChange={(e) => onChange({ variationCount: Math.max(1, Math.min(6, Number(e.target.value) || 1)) })}
                  className="bg-white/5 text-white"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="invisible sm:visible">Actions</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-white/15 bg-white/5 text-white hover:bg-white/10"
                    onClick={() => {
                      // indicate to parent that user intends A/B; parent will decide how to map this at generation time
                      onChange({}) // no-op, the UI implies A/B
                    }}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Prepare A/B
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="batch" className="space-y-3">
            <div className="text-xs text-white/70">
              Quickly explore multiple variations. We’ll keep your style settings and adjust seeds under the hood.
            </div>
            <div className="grid max-w-sm grid-cols-3 items-end gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="var2">Variations</Label>
                <Input
                  id="var2"
                  type="number"
                  min={1}
                  max={6}
                  value={variationCount}
                  onChange={(e) => onChange({ variationCount: Math.max(1, Math.min(6, Number(e.target.value) || 1)) })}
                  className="bg-white/5 text-white"
                />
              </div>
              <div className="col-span-2">
                <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600">
                  Generate Batch
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="presets" className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {presets.length === 0 ? (
                <div className="text-xs text-white/60">No presets yet. Save your current setup for reuse.</div>
              ) : null}
              {presets.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    "flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs",
                  )}
                >
                  <span className="font-medium">{p.name}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-white/80 hover:bg-white/10"
                    onClick={() => onApplyOptions?.(p)}
                  >
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-white/60 hover:bg-white/10"
                    onClick={() => removePreset(p.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            <SaveCurrentPreset currentOptions={currentOptions} onAdd={addPreset} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function SaveCurrentPreset({
  currentOptions,
  onAdd,
}: {
  currentOptions: AdvancedControlsProps["currentOptions"]
  onAdd: (p: Omit<Preset, "id" | "createdAt">) => Preset
}) {
  const [name, setName] = React.useState("")
  const [desc, setDesc] = React.useState("")

  return (
    <div className="grid gap-3 rounded-md border border-white/10 bg-white/5 p-3 sm:grid-cols-3">
      <div className="grid gap-1.5">
        <Label htmlFor="preset-name">Preset name</Label>
        <Input
          id="preset-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Product Demo – Cinematic"
          className="bg-white/5 text-white placeholder:text-white/40"
        />
      </div>
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor="preset-desc">Description (optional)</Label>
        <Input
          id="preset-desc"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Quick cinematic demo with standard quality"
          className="bg-white/5 text-white placeholder:text-white/40"
        />
      </div>
      <div className="sm:col-span-3">
        <Button
          disabled={!name.trim()}
          onClick={() => {
            onAdd({
              name: name.trim(),
              description: desc.trim() || undefined,
              ...currentOptions,
              negativePrompt: undefined,
              variationCount: 1,
              ratio: undefined,
              brand: null,
            })
            setName("")
            setDesc("")
          }}
          className="w-full bg-gradient-to-r from-violet-600 to-indigo-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Save current settings as preset
        </Button>
      </div>
    </div>
  )
}
