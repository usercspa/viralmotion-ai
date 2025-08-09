"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Quote } from "lucide-react"

const testimonials = [
  {
    quote: "In two weeks we grew our Instagram by 38% with daily AI-made clips. The workflow is insanely fast.",
    name: "Maya Patel",
    role: "Founder, LumaLabs",
    avatar: "/avatar-maya.png",
  },
  {
    quote: "Our CPC dropped 27% after switching to short-form videos from this tool.",
    name: "Jordan Lee",
    role: "Head of Growth, Finch",
    avatar: "/stylized-basketball-avatar.png",
  },
  {
    quote: "The analytics helped us double retention in our first month.",
    name: "Avery Chen",
    role: "Marketing Manager, Nova",
    avatar: "/avatar-avery.png",
  },
]

export function SocialProof() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24">
      <div className="grid gap-4 md:grid-cols-3">
        {testimonials.map((t) => (
          <Card
            key={t.name}
            className="relative overflow-hidden border-white/10 bg-white/[0.04] text-white backdrop-blur transition-all hover:-translate-y-1"
          >
            <CardContent className="p-6">
              <Quote className="mb-3 size-5 text-white/30" aria-hidden="true" />
              <p className="text-white/90">
                {"“"}
                {t.quote}
                {"”"}
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Avatar className="border border-white/20">
                  <AvatarImage src={t.avatar || "/placeholder.svg"} alt={`${t.name} avatar`} />
                  <AvatarFallback>
                    {t.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-white/60">{t.role}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
