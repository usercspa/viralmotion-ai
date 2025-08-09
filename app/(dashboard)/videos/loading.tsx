"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function VideosLoading() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <Skeleton className="mb-4 h-8 w-40" />
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-video w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
