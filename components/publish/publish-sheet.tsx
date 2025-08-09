"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useToast } from "@/hooks/use-toast"

type Platform = "Instagram" | "TikTok" | "YouTube" | "LinkedIn"

export function PublishSheet({
  open,
  onOpenChange,
  defaultCaption,
  videoUrl,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultCaption?: string
  videoUrl?: string | null
}) {
  const { toast } = useToast()
  const [platforms, setPlatforms] = React.useState<Platform[]>(["TikTok", "Instagram"])
  const [date, setDate] = React.useState("")
  const [time, setTime] = React.useState("")
  const [caption, setCaption] = React.useState(defaultCaption || "")

  function toggle(p: Platform, v: boolean) {
    setPlatforms((prev) => {
      const s = new Set(prev)
      if (v) s.add(p)
      else s.delete(p)
      return Array.from(s) as Platform[]
    })
  }

  async function onPublish() {
    // Mock publish -> store to localStorage
    const key = "vvm:publishes"
    const entry = {
      id: crypto.randomUUID(),
      platforms,
      caption,
      videoUrl: videoUrl || null,
      schedule: date && time ? { date, time } : null,
      createdAt: new Date().toISOString(),
      status: "queued" as const,
    }
    try {
      const raw = localStorage.getItem(key)
      const arr = raw ? JSON.parse(raw) : []
      localStorage.setItem(key, JSON.stringify([entry, ...arr]))
      toast({ title: "Publishing queued", description: "We’ll publish on the selected platforms." })
      onOpenChange(false)
    } catch {
      toast({ title: "Could not queue publish", description: "Please try again.", variant: "destructive" })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-white/[0.03]">
        <SheetHeader>
          <SheetTitle>Publish your video</SheetTitle>
          <SheetDescription className="text-white/70">
            Select platforms, tweak the caption, and schedule your post.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["Instagram", "TikTok", "YouTube", "LinkedIn"] as Platform[]).map((p) => {
              const checked = platforms.includes(p)
              return (
                <label
                  key={p}
                  htmlFor={`pub-${p}`}
                  className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm ${
                    checked ? "border-violet-500/40 bg-violet-500/10" : "border-white/10 bg-white/5"
                  }`}
                >
                  <Checkbox id={`pub-${p}`} checked={checked} onCheckedChange={(v) => toggle(p, Boolean(v))} />
                  {p}
                </label>
              )
            })}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cap">Caption</Label>
            <Input
              id="cap"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="bg-white/5 text-white placeholder:text-white/40"
              placeholder="Write a catchy caption…"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-2">
              <Label htmlFor="date">Date (optional)</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">Time (optional)</Label>
              <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <div className="pt-2">
            <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white" onClick={onPublish}>
              Publish
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
