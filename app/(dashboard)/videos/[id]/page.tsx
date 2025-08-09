"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeft,
  Download,
  Loader2,
  Music2,
  Pause,
  Play,
  RefreshCcw,
  Save,
  Send,
  Settings,
  Wand2,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type Caption = {
  id: string
  start: number // seconds
  end: number // seconds
  text: string
}

type Track = {
  id: string
  title: string
  artist: string
  url: string
}

const trendingTracks: Track[] = [
  { id: "t1", title: "Night Drive", artist: "Noir Labs", url: "/audio/track-1.mp3" },
  { id: "t2", title: "Neon Lights", artist: "Citywave", url: "/audio/track-2.mp3" },
  { id: "t3", title: "Momentum", artist: "Flux", url: "/audio/track-3.mp3" },
  { id: "t4", title: "Uplift", artist: "Falcon", url: "/audio/track-1.mp3" },
  { id: "t5", title: "Pulse", artist: "Atari Sun", url: "/audio/track-2.mp3" },
  { id: "t6", title: "Echoes", artist: "Signal", url: "/audio/track-3.mp3" },
]

const hashtagSuggestions = ["#startup", "#marketing", "#ai", "#shorts", "#ugc", "#content", "#founders", "#growth"]

export default function VideoEditorPage() {
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const [title, setTitle] = React.useState<string>("How to launch your MVP in 7 days")
  const [description, setDescription] = React.useState<string>(
    "A quick, actionable framework to ship faster and validate smarter.",
  )
  const [duration, setDuration] = React.useState<number>(0)
  const [resolution] = React.useState<string>("1080 x 1920")
  const [fileSize] = React.useState<string>("18.4 MB")
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false)
  const [currentTime, setCurrentTime] = React.useState<number>(0)
  const [regenerating, setRegenerating] = React.useState<boolean>(false)

  const videoRef = React.useRef<HTMLVideoElement>(null)
  const audioRef = React.useRef<HTMLAudioElement>(null)

  // Editing state
  const [captions, setCaptions] = React.useState<Caption[]>([
    { id: crypto.randomUUID(), start: 0, end: 3.5, text: "Stop scrolling — launch in 7 days." },
    { id: crypto.randomUUID(), start: 3.5, end: 8.5, text: "Step 1: Nail the problem in one sentence." },
    { id: crypto.randomUUID(), start: 8.5, end: 14, text: "Step 2: Ship a clickable demo, not a deck." },
  ])
  const [captionColor, setCaptionColor] = React.useState<string>("#111111")
  const [captionBg, setCaptionBg] = React.useState<string>("#ffffff")
  const [captionFont, setCaptionFont] = React.useState<"sans" | "serif" | "mono">("sans")

  const [brandBg, setBrandBg] = React.useState<string>("#0B0B0F")
  const [brandText, setBrandText] = React.useState<string>("#FFFFFF")
  const [logoUrl, setLogoUrl] = React.useState<string | null>(null)
  const [logoPlacement, setLogoPlacement] = React.useState<
    "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center" | "custom"
  >("top-left")
  const [logoCustom, setLogoCustom] = React.useState<{ x: number; y: number }>({ x: 50, y: 50 })

  const [selectedTrack, setSelectedTrack] = React.useState<string | null>(trendingTracks[0].id)
  const [musicVolume, setMusicVolume] = React.useState<number>(50)
  const [voiceover, setVoiceover] = React.useState<{ enabled: boolean; voice: "female" | "male" | "neutral" }>({
    enabled: false,
    voice: "neutral",
  })

  // Publish modal
  const [openPublish, setOpenPublish] = React.useState(false)
  const [schedule, setSchedule] = React.useState<{ date: string; time: string }>(() => {
    const now = new Date()
    const date = now.toISOString().slice(0, 10)
    const roundedMinutes = Math.ceil(now.getMinutes() / 5) * 5
    now.setMinutes(roundedMinutes)
    return { date, time: now.toTimeString().slice(0, 5) }
  })
  const [platforms, setPlatforms] = React.useState<{
    Instagram: boolean
    TikTok: boolean
    YouTube: boolean
    LinkedIn: boolean
  }>({ Instagram: true, TikTok: false, YouTube: true, LinkedIn: false })
  const [platformCaptions, setPlatformCaptions] = React.useState<Record<string, string>>({
    Instagram: "Launching an MVP in 7 days — here's the playbook.",
    TikTok: "Ship in a week. Here’s how.",
    YouTube: "How to launch your MVP in 7 days (framework)",
    LinkedIn: "A 7-day MVP process I use with founders.",
  })

  const [platformConnections, setPlatformConnections] = React.useState<{
    Instagram: boolean
    TikTok: boolean
    YouTube: boolean
    LinkedIn: boolean
  }>({ Instagram: true, TikTok: false, YouTube: true, LinkedIn: false })

  const [connecting, setConnecting] = React.useState<Record<string, boolean>>({})
  const [publishError, setPublishError] = React.useState<string | null>(null)

  const [publishing, setPublishing] = React.useState(false)

  // Load metadata and mock: If we had localStorage from wizard, we could load it here.
  React.useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const onLoaded = () => {
      setDuration(v.duration || 0)
    }
    const onTime = () => setCurrentTime(v.currentTime)
    v.addEventListener("loadedmetadata", onLoaded)
    v.addEventListener("timeupdate", onTime)
    return () => {
      v.removeEventListener("loadedmetadata", onLoaded)
      v.removeEventListener("timeupdate", onTime)
    }
  }, [])

  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume / 100
    }
  }, [musicVolume])

  function togglePlay() {
    const v = videoRef.current
    if (!v) return
    if (isPlaying) {
      v.pause()
      audioRef.current?.pause()
      setIsPlaying(false)
    } else {
      void v.play()
      if (selectedTrack) {
        const t = trendingTracks.find((x) => x.id === selectedTrack)
        if (t && audioRef.current) {
          if (audioRef.current.src.endsWith(t.url)) {
            // resume
          } else {
            audioRef.current.src = t.url
          }
          void audioRef.current.play()
        }
      }
      setIsPlaying(true)
    }
  }

  function onScrub(nextTime: number) {
    const v = videoRef.current
    if (!v) return
    v.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  function addCaption() {
    const start = Number(Math.max(0, Math.min(duration - 1, currentTime)).toFixed(1))
    const end = Number(Math.min(duration, start + 2.5).toFixed(1))
    setCaptions((prev) => [...prev, { id: crypto.randomUUID(), start, end, text: "New caption..." }])
  }

  function regenerateVideo() {
    setRegenerating(true)
    setTimeout(() => {
      setRegenerating(false)
      toast({ title: "Regenerated", description: "Your video was regenerated with the latest edits." })
    }, 1400)
  }

  function saveChanges() {
    // Persist to localStorage under vvm:video:<id>
    const key = `vvm:video:${params.id}`
    const payload = {
      title,
      description,
      captions,
      captionColor,
      captionBg,
      captionFont,
      brandBg,
      brandText,
      logoUrl,
      logoPlacement,
      logoCustom,
      selectedTrack,
      musicVolume,
      voiceover,
    }
    try {
      localStorage.setItem(key, JSON.stringify(payload))
      toast({ title: "Saved", description: "Your changes have been saved." })
    } catch {
      toast({ title: "Error", description: "Could not save your changes.", variant: "destructive" })
    }
  }

  function downloadVideo() {
    // Mock download of the preview file
    const a = document.createElement("a")
    a.href = "/sample-preview.mp4"
    a.download = `${title.replace(/\s+/g, "-")}.mp4`
    document.body.appendChild(a)
    a.click()
    a.remove()
    toast({ title: "Download started", description: "Your video is downloading." })
  }

  function publishNow() {
    setPublishError(null)
    setPublishing(true)
    // Simulate random success/error
    setTimeout(() => {
      const failed = Math.random() < 0.2
      setPublishing(false)
      if (failed) {
        setPublishError("We couldn't publish to one or more platforms. Please check connections and try again.")
        return
      }
      setOpenPublish(false)
      toast({ title: "Published", description: "Your video has been published to selected platforms." })
    }, 1500)
  }

  // Helper for overlay font
  const captionFontClass = captionFont === "serif" ? "font-serif" : captionFont === "mono" ? "font-mono" : "font-sans"

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" asChild className="text-white/80 hover:bg-white/10">
          <Link href="/videos">
            <ArrowLeft className="mr-2 size-4" />
            Back to My Videos
          </Link>
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            onClick={regenerateVideo}
            disabled={regenerating}
          >
            {regenerating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCcw className="mr-2 size-4" />}
            Regenerate Video
          </Button>
          <Button
            className="bg-gradient-to-r from-fuchsia-600 to-rose-600 text-white hover:from-fuchsia-500 hover:to-rose-500"
            onClick={saveChanges}
          >
            <Save className="mr-2 size-4" />
            Save Changes
          </Button>
          <Button
            variant="outline"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            onClick={() => setOpenPublish(true)}
          >
            <Send className="mr-2 size-4" />
            Publish Now
          </Button>
          <Button
            variant="outline"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            onClick={() => {
              const now = new Date()
              now.setHours(now.getHours() + 2)
              const date = now.toISOString().slice(0, 10)
              const time = now.toTimeString().slice(0, 5)
              setSchedule({ date, time })
              setOpenPublish(true)
            }}
          >
            <Wand2 className="mr-2 size-4" />
            Schedule Post
          </Button>
          <Button
            variant="outline"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            onClick={downloadVideo}
          >
            <Download className="mr-2 size-4" />
            Download Video
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Video preview, info, controls */}
        <div className="lg:col-span-2">
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle>Video Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative overflow-hidden rounded-xl border border-white/10">
                {/* Preview background and overlay */}
                <div className="relative">
                  <video
                    ref={videoRef}
                    src="/sample-preview.mp4"
                    className="aspect-[9/16] w-full bg-black object-cover"
                    controls={false}
                    playsInline
                  />
                  {/* Brand overlay color (subtle) */}
                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{ background: brandBg, opacity: 0.05 }}
                  />
                  {/* Logo overlay */}
                  {logoUrl && (
                    <img
                      src={logoUrl || "/placeholder.svg"}
                      alt="Logo"
                      className={cn(
                        "pointer-events-none absolute z-10 h-12 w-12 rounded bg-white/10 object-contain p-1",
                        logoPlacement === "top-left" && "left-3 top-3",
                        logoPlacement === "top-right" && "right-3 top-3",
                        logoPlacement === "bottom-left" && "left-3 bottom-3",
                        logoPlacement === "bottom-right" && "right-3 bottom-3",
                        logoPlacement === "center" && "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                        logoPlacement === "custom" && "left-0 top-0",
                      )}
                      style={
                        logoPlacement === "custom" ? { left: `${logoCustom.x}%`, top: `${logoCustom.y}%` } : undefined
                      }
                    />
                  )}
                  {/* Active captions overlay */}
                  <CaptionOverlay
                    time={currentTime}
                    captions={captions}
                    captionColor={captionColor}
                    captionBg={captionBg}
                    className={captionFontClass}
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 border-t border-white/10 bg-black/40 p-3">
                  <Button variant="ghost" size="icon" className="text-white" onClick={togglePlay}>
                    {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
                  </Button>
                  <div className="text-xs text-white/80 tabular-nums">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(1, duration)}
                    step={0.1}
                    value={currentTime}
                    onChange={(e) => onScrub(Number(e.target.value))}
                    className="mx-2 h-2 flex-1 cursor-pointer appearance-none rounded bg-white/10 accent-fuchsia-500"
                    aria-label="Timeline scrubber"
                    role="slider"
                    aria-valuemin={0}
                    aria-valuemax={Math.max(1, duration)}
                    aria-valuenow={Number.isFinite(currentTime) ? Number(currentTime.toFixed(1)) : 0}
                    aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
                  />
                  <div className="text-xs text-white/60">
                    {resolution} • {fileSize}
                  </div>
                </div>
              </div>

              {/* Editable title/description with high contrast user text */}
              <div className="mt-4 grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-white">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-white text-black placeholder:text-neutral-500"
                    placeholder="Enter video title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="desc" className="text-white">
                    Description
                  </Label>
                  <Textarea
                    id="desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="min-h-[100px] bg-white text-black placeholder:text-neutral-500"
                    placeholder="Describe your video"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Editing panel */}
        <aside className="lg:sticky lg:top-20">
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Settings className="size-4 text-white/80" />
                <CardTitle>Editing Panel</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="text">
                <TabsList className="mb-3 grid w-full grid-cols-3">
                  <TabsTrigger value="text">Text & Captions</TabsTrigger>
                  <TabsTrigger value="brand">Brand</TabsTrigger>
                  <TabsTrigger value="audio">Audio</TabsTrigger>
                </TabsList>

                {/* Text & Captions */}
                <TabsContent value="text" className="space-y-4">
                  <div className="grid gap-2">
                    <Label className="text-white">Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-white text-black placeholder:text-neutral-500"
                      placeholder="Video title"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-white">Description</Label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="min-h-[80px] bg-white text-black placeholder:text-neutral-500"
                      placeholder="Video description"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-white">Captions</Label>
                    <Button
                      variant="outline"
                      className="h-8 border-white/15 bg-white text-black hover:bg-neutral-100"
                      onClick={addCaption}
                    >
                      + Add caption
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {captions.map((c) => (
                      <div key={c.id} className="rounded-md border border-white/10 bg-white/5 p-2">
                        <div className="mb-2 flex items-center gap-2 text-xs text-white/70">
                          <span>Start</span>
                          <Input
                            type="number"
                            step="0.1"
                            min={0}
                            max={Math.max(0, duration - 0.1)}
                            value={c.start}
                            onChange={(e) =>
                              setCaptions((prev) =>
                                prev.map((x) => (x.id === c.id ? { ...x, start: Number(e.target.value) } : x)),
                              )
                            }
                            className="h-8 w-20 bg-white text-black"
                          />
                          <span>End</span>
                          <Input
                            type="number"
                            step="0.1"
                            min={0}
                            max={duration}
                            value={c.end}
                            onChange={(e) =>
                              setCaptions((prev) =>
                                prev.map((x) => (x.id === c.id ? { ...x, end: Number(e.target.value) } : x)),
                              )
                            }
                            className="h-8 w-20 bg-white text-black"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-auto h-8 text-white/80 hover:bg-white/10"
                            onClick={() => {
                              onScrub(c.start)
                            }}
                          >
                            Jump
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-white/80 hover:bg-white/10"
                            onClick={() => setCaptions((prev) => prev.filter((x) => x.id !== c.id))}
                          >
                            Remove
                          </Button>
                        </div>
                        <Textarea
                          value={c.text}
                          onChange={(e) =>
                            setCaptions((prev) => prev.map((x) => (x.id === c.id ? { ...x, text: e.target.value } : x)))
                          }
                          className="bg-white text-black placeholder:text-neutral-500"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="grid gap-1">
                      <Label className="text-white">Font</Label>
                      <select
                        value={captionFont}
                        onChange={(e) => setCaptionFont(e.target.value as any)}
                        className="h-9 rounded-md border border-white/10 bg-white px-2 text-sm text-black"
                      >
                        <option value="sans">Sans</option>
                        <option value="serif">Serif</option>
                        <option value="mono">Mono</option>
                      </select>
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-white">Text color</Label>
                      <Input
                        type="color"
                        value={captionColor}
                        onChange={(e) => setCaptionColor(e.target.value)}
                        className="h-9 w-full bg-transparent p-1"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-white">Bubble</Label>
                      <Input
                        type="color"
                        value={captionBg}
                        onChange={(e) => setCaptionBg(e.target.value)}
                        className="h-9 w-full bg-transparent p-1"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Brand */}
                <TabsContent value="brand" className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-1">
                      <Label className="text-white">Overlay color</Label>
                      <Input
                        type="color"
                        value={brandBg}
                        onChange={(e) => setBrandBg(e.target.value)}
                        className="h-9 w-20 bg-transparent p-1"
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label className="text-white">Text color</Label>
                      <Input
                        type="color"
                        value={brandText}
                        onChange={(e) => setBrandText(e.target.value)}
                        className="h-9 w-20 bg-transparent p-1"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-white">Logo</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      className="bg-white text-black file:mr-3 file:rounded-md file:border-0 file:bg-neutral-200 file:px-3 file:py-2 file:text-black"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (!f) return
                        const url = URL.createObjectURL(f)
                        setLogoUrl(url)
                      }}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-white">Placement</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["top-left", "top-right", "bottom-left", "bottom-right", "center", "custom"] as const).map(
                        (pos) => (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => setLogoPlacement(pos)}
                            className={cn(
                              "rounded-md border px-2 py-1 text-xs capitalize transition",
                              logoPlacement === pos
                                ? "border-fuchsia-400/50 bg-fuchsia-500/10 text-white"
                                : "border-white/10 bg-white/5 text-white hover:bg-white/10",
                            )}
                          >
                            {pos.replace("-", " ")}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  {logoPlacement === "custom" && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="grid gap-1">
                        <Label className="text-white">X (%)</Label>
                        <Input
                          type="number"
                          className="bg-white text-black"
                          min={0}
                          max={100}
                          value={logoCustom.x}
                          onChange={(e) => setLogoCustom((p) => ({ ...p, x: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="grid gap-1">
                        <Label className="text-white">Y (%)</Label>
                        <Input
                          type="number"
                          className="bg-white text-black"
                          min={0}
                          max={100}
                          value={logoCustom.y}
                          onChange={(e) => setLogoCustom((p) => ({ ...p, y: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label className="text-white">Background</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Solid", "Blur", "Gradient"].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white hover:bg-white/10"
                          onClick={() => {
                            if (opt === "Solid") {
                              // no-op
                            } else if (opt === "Blur") {
                              toast({ title: "Background blur", description: "Applied subtle blur to background." })
                            } else {
                              toast({ title: "Gradient background", description: "Applied a trendy gradient overlay." })
                            }
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Audio */}
                <TabsContent value="audio" className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Music2 className="size-4 text-white/80" />
                    <span className="text-sm text-white/90">Trending tracks</span>
                  </div>
                  <div className="grid gap-2">
                    {trendingTracks.map((t) => {
                      const active = selectedTrack === t.id
                      return (
                        <div
                          key={t.id}
                          className={cn(
                            "flex items-center justify-between rounded-md border p-2",
                            active ? "border-fuchsia-400/50 bg-fuchsia-500/10" : "border-white/10 bg-white/5",
                          )}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm text-white">{t.title}</p>
                            <p className="truncate text-xs text-white/60">{t.artist}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant={active ? "default" : "outline"}
                              className={cn(
                                "h-8",
                                active
                                  ? "bg-gradient-to-r from-fuchsia-600 to-rose-600 text-white hover:from-fuchsia-500 hover:to-rose-500"
                                  : "border-white/15 bg-white/5 text-white hover:bg-white/10",
                              )}
                              onClick={() => {
                                setSelectedTrack(t.id)
                                if (audioRef.current) {
                                  audioRef.current.src = t.url
                                  void audioRef.current.play()
                                }
                              }}
                            >
                              {active ? "Selected" : "Select"}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-white hover:bg-white/10"
                              onClick={() => {
                                if (audioRef.current) {
                                  if (audioRef.current.src.endsWith(t.url) && !audioRef.current.paused) {
                                    audioRef.current.pause()
                                  } else {
                                    audioRef.current.src = t.url
                                    void audioRef.current.play()
                                  }
                                }
                              }}
                            >
                              <Play className="size-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                    <audio ref={audioRef} className="hidden" />
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-white">Music volume</Label>
                    <Slider
                      value={[musicVolume]}
                      onValueChange={(v) => setMusicVolume(v[0] ?? 50)}
                      max={100}
                      step={1}
                      className="[&>span]:bg-fuchsia-500"
                    />
                  </div>

                  <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                    <Checkbox
                      id="voiceover-enabled"
                      checked={voiceover.enabled}
                      onCheckedChange={(v) => setVoiceover((p) => ({ ...p, enabled: Boolean(v) }))}
                    />
                    <Label htmlFor="voiceover-enabled" className="text-white">
                      Enable AI voiceover
                    </Label>
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-white">Voice</Label>
                    <select
                      value={voiceover.voice}
                      onChange={(e) => setVoiceover((p) => ({ ...p, voice: e.target.value as any }))}
                      className="h-9 rounded-md border border-white/10 bg-white px-2 text-sm text-black disabled:opacity-50"
                      disabled={!voiceover.enabled}
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="neutral">Neutral</option>
                    </select>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </aside>
      </div>

      {/* Publish dialog */}
      <Dialog open={openPublish} onOpenChange={setOpenPublish}>
        <DialogContent className="max-w-2xl border-white/10 bg-[#0B0B0F] text-white">
          <DialogHeader>
            <DialogTitle>Publish</DialogTitle>
            <DialogDescription className="text-white/60">
              Select platforms, customize captions, add hashtags, and publish or schedule.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <div className="text-sm font-medium">Platforms</div>
              {(
                [{ name: "Instagram" }, { name: "TikTok" }, { name: "YouTube" }, { name: "LinkedIn" }] as {
                  name: keyof typeof platforms
                }[]
              ).map((p) => {
                const connected = platformConnections[p.name]
                return (
                  <div
                    key={p.name}
                    className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-2"
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`pf-${p.name}`}
                        checked={platforms[p.name]}
                        onCheckedChange={(v) => setPlatforms((prev) => ({ ...prev, [p.name]: Boolean(v) }))}
                        disabled={!connected}
                      />
                      <Label htmlFor={`pf-${p.name}`} className={cn("text-white", !connected && "opacity-60")}>
                        {p.name}
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-xs",
                          connected
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-300",
                        )}
                      >
                        {connected ? "Connected" : "Disconnected"}
                      </span>
                      {!connected ? (
                        <Button
                          size="sm"
                          className="h-7 bg-gradient-to-r from-fuchsia-600 to-rose-600 text-white hover:from-fuchsia-500 hover:to-rose-500"
                          disabled={!!connecting[p.name]}
                          onClick={() => {
                            setConnecting((c) => ({ ...c, [p.name]: true }))
                            setTimeout(() => {
                              setConnecting((c) => ({ ...c, [p.name]: false }))
                              setPlatformConnections((prev) => ({ ...prev, [p.name]: true }))
                              setPlatforms((prev) => ({ ...prev, [p.name]: true }))
                            }, 900)
                          }}
                        >
                          {connecting[p.name] ? "Connecting..." : "Connect"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 border-white/15 bg-white/5 text-white hover:bg-white/10"
                          onClick={() => {
                            setPlatformConnections((prev) => ({ ...prev, [p.name]: false }))
                            setPlatforms((prev) => ({ ...prev, [p.name]: false }))
                          }}
                        >
                          Disconnect
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}

              <div className="grid gap-2">
                <Label className="text-white">Schedule</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    className="bg-white text-black"
                    value={schedule.date}
                    onChange={(e) => setSchedule((s) => ({ ...s, date: e.target.value }))}
                  />
                  <Input
                    type="time"
                    className="bg-white text-black"
                    value={schedule.time}
                    onChange={(e) => setSchedule((s) => ({ ...s, time: e.target.value }))}
                  />
                </div>
                <p className="text-xs text-white/50">Posts will publish in your local timezone.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium">Per-platform captions</div>
              {Object.keys(platformCaptions).map((k) => {
                const enabled = platforms[k as keyof typeof platforms]
                return (
                  <div key={k} className={cn("grid gap-1 rounded-md border p-2", "border-white/10 bg-white/5")}>
                    <Label className="text-white">{k}</Label>
                    <Textarea
                      className="min-h-[70px] bg-white text-black placeholder:text-neutral-500 disabled:opacity-50"
                      value={platformCaptions[k]}
                      onChange={(e) =>
                        setPlatformCaptions((prev) => ({
                          ...prev,
                          [k]: e.target.value,
                        }))
                      }
                      disabled={!enabled}
                    />
                  </div>
                )
              })}
              <div>
                <div className="mb-1 text-sm text-white/80">Hashtag suggestions</div>
                <div className="flex flex-wrap gap-2">
                  {hashtagSuggestions.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white hover:bg-white/10"
                      onClick={() => {
                        const enabledPlatforms = Object.keys(platforms).filter(
                          (p) => platforms[p as keyof typeof platforms],
                        )
                        setPlatformCaptions((prev) => {
                          const next = { ...prev }
                          enabledPlatforms.forEach((p) => {
                            if (!next[p].includes(tag)) {
                              next[p] = `${next[p]} ${tag}`.trim()
                            }
                          })
                          return next
                        })
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {publishError && (
            <Alert variant="destructive" className="border-red-500/30 bg-red-500/10 text-red-200">
              <AlertDescription>{publishError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              onClick={publishNow}
              disabled={publishing}
              className="bg-gradient-to-r from-fuchsia-600 to-rose-600 text-white hover:from-fuchsia-500 hover:to-rose-500"
            >
              {publishing ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatTime(t: number) {
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

function CaptionOverlay({
  time,
  captions,
  captionColor,
  captionBg,
  className,
}: {
  time: number
  captions: Caption[]
  captionColor: string
  captionBg: string
  className?: string
}) {
  const active = captions.find((c) => time >= c.start && time <= c.end)
  if (!active) return null
  return (
    <div className="pointer-events-none absolute bottom-5 left-4 right-4 z-10 flex justify-center">
      <span
        className={cn("rounded-md px-3 py-2 text-sm", className)}
        style={{ background: captionBg, color: captionColor }}
      >
        {active.text}
      </span>
    </div>
  )
}
