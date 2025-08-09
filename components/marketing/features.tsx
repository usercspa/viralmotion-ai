"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Activity, BarChart3, Share2, Type } from "lucide-react"

const features = [
  {
    title: "AI Script Generation",
    description: "Turn product ideas into short-form scripts in your brand voice.",
    icon: Type,
  },
  {
    title: "One-Click Publishing",
    description: "Push to TikTok, Instagram, and YouTube Shorts instantly.",
    icon: Share2,
  },
  {
    title: "Trend Integration",
    description: "Ride trending audio and topics to maximize reach.",
    icon: Activity,
  },
  {
    title: "Analytics Dashboard",
    description: "Track views, retention, and virality across platforms.",
    icon: BarChart3,
  },
]

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 pb-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold text-white md:text-4xl">Everything you need to go viral</h2>
        <p className="mt-3 text-white/70">From idea to published video — fast, polished, and on-brand.</p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <Card
            key={f.title}
            className="group relative overflow-hidden border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent text-white backdrop-blur transition-all hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
          >
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-indigo-500/10" />
            </div>
            <CardContent className="relative flex gap-4 p-6">
              <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-md bg-gradient-to-br from-violet-600/40 to-indigo-600/40 ring-1 ring-inset ring-white/10 transition-transform group-hover:scale-110">
                <f.icon className="size-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-base font-medium">{f.title}</h3>
                <p className="mt-1 text-sm text-white/70">{f.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
