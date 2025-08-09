"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function CreateLoading() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <Skeleton className="mb-3 h-4 w-44" />
      <div className="mb-6 grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
      <div className="mt-6 flex gap-3">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  )
}
