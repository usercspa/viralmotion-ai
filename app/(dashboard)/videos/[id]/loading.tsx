"use client"

import { Skeleton } from "@/components/ui/skeleton"

export default function VideoEditorLoading() {
  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-9 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="aspect-[9/16] w-full rounded-xl lg:col-span-2" />
        <Skeleton className="h-[520px] w-full rounded-xl" />
      </div>
    </div>
  )
}
