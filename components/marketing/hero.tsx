"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, Loader2, Play, ShieldCheck, Sparkles, Star } from "lucide-react"
import * as React from "react"

type HeroProps = {
  onSignUp?: () => void
  onSignIn?: () => void
}

export function Hero({ onSignUp, onSignIn }: HeroProps) {
  const [previewLoading, setPreviewLoading] = React.useState(false)

  return (
    <section className="relative isolate overflow-hidden">
      {/* Gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(88,28,135,0.4),rgba(29,78,216,0.25)_40%,transparent_70%)]" />
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-16 pt-12 md:grid-cols-2 md:gap-16 md:pb-24 md:pt-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
            <Sparkles className="size-3.5 text-violet-400" />
            AI video, simplified
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-6xl">
            Create viral videos in minutes with AI
          </h1>
          <p className="mt-4 max-w-prose text-white/70 md:text-lg">
            Founders and small businesses use our AI to generate scripts, auto-create videos, and publish everywhere.
            Grow faster with content that sticks.
          </p>
          <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row">
            <Button
              onClick={onSignUp}
              asChild={!onSignUp}
              className="group relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 text-white transition-all duration-200 hover:scale-[1.03] hover:from-violet-500 hover:to-indigo-500"
            >
              {onSignUp ? (
                <span className="relative">
                  Get started free
                  <span className="absolute inset-0 -z-10 blur-xl" />
                </span>
              ) : (
                <Link href="/auth/sign-up" className="relative">
                  Get started free
                </Link>
              )}
            </Button>
            <Button
              asChild={!onSignIn}
              variant="outline"
              onClick={onSignIn}
              className="relative border-white/15 bg-white/5 text-white transition-all hover:scale-[1.02] hover:bg-white/10"
            >
              {onSignIn ? (
                <span className="relative flex items-center">
                  <Play className="mr-2 size-4" />
                  Watch demo
                </span>
              ) : (
                <Link href="#demo" className="relative flex items-center">
                  <Play className="mr-2 size-4" />
                  Watch demo
                </Link>
              )}
            </Button>
          </div>
          {/* Social proof under CTAs */}
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex -space-x-3">
              {[
                "/diverse-group-avatars.png",
                "/pandora-ocean-scene.png",
                "/diverse-group-futuristic-setting.png",
                "/diverse-group-futuristic-avatars.png",
                "/diverse-futuristic-avatars.png",
              ].map((src, i) => (
                <Avatar key={i} className="border border-white/20">
                  <AvatarImage src={src || "/placeholder.svg"} alt={`User ${i + 1}`} />
                  <AvatarFallback>U{i + 1}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <div className="text-white/80">
              <div className="flex items-center gap-2">
                <Star className="size-4 text-yellow-400" />
                <span className="text-sm">4.9/5 average rating</span>
                <span className="mx-2 text-white/30">•</span>
                <span className="text-sm">10,000+ videos generated</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-white/60">
                <ShieldCheck className="size-4 text-emerald-400" />
                Trusted by founders and teams worldwide
              </div>
            </div>
          </div>
        </div>

        {/* Right: Video creation process preview mockup */}
        <div className="relative">
          <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-2xl">
            <div className="aspect-video w-full">
              {/* Simulated video thumbnail */}
              <div className="relative h-full w-full">
                <img
                  src="/video-script-timeline-dark.png"
                  alt="AI video creation timeline preview"
                  className="h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.02]"
                  onLoad={() => setPreviewLoading(false)}
                />
                {previewLoading && (
                  <div className="absolute inset-0 grid place-items-center bg-black/30">
                    <Loader2 className="size-6 animate-spin text-white" />
                  </div>
                )}
                {/* Play button */}
                <button
                  type="button"
                  aria-label="Play preview"
                  className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-xs text-white/90 backdrop-blur transition hover:bg-black/60"
                >
                  <Play className="size-3.5" />
                  Preview
                </button>
                {/* Process steps overlay */}
                <div className="pointer-events-none absolute right-4 top-4 w-56 rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-white/90 backdrop-blur">
                  <p className="mb-2 font-medium">AI Process</p>
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-emerald-400" /> Generate script
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-emerald-400" /> Auto captions
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-3.5 text-emerald-400" /> Add b-roll
                    </li>
                    <li className="flex items-center gap-2 opacity-90">Publish</li>
                  </ul>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded bg-white/10">
                    <div className="h-1 w-2/3 animate-pulse rounded bg-gradient-to-r from-violet-500 to-indigo-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glows */}
          <div className="pointer-events-none absolute -left-6 -top-6 -z-10 h-40 w-40 rounded-full bg-violet-600/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-6 -right-6 -z-10 h-40 w-40 rounded-full bg-indigo-600/30 blur-3xl" />
        </div>
      </div>
    </section>
  )
}
