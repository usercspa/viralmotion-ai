"use client"

import * as React from "react"

type EnqueuedJob = {
  id: string
  requestBody: unknown
  createdAt: string
}

const STORAGE_KEY = "vvm:offline-job-queue"

function readQueue(): EnqueuedJob[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as EnqueuedJob[]) : []
  } catch {
    return []
  }
}

function writeQueue(items: EnqueuedJob[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // ignore
  }
}

export function useOfflineQueue() {
  const [queued, setQueued] = React.useState<EnqueuedJob[]>([])

  React.useEffect(() => {
    setQueued(readQueue())
  }, [])

  function enqueue(requestBody: unknown) {
    const item: EnqueuedJob = { id: crypto.randomUUID(), requestBody, createdAt: new Date().toISOString() }
    const next = [item, ...queued]
    setQueued(next)
    writeQueue(next)
    return item
  }

  async function flush(submit: (body: unknown) => Promise<void>) {
    const items = readQueue()
    const remaining: EnqueuedJob[] = []
    for (const item of items) {
      try {
        await submit(item.requestBody)
      } catch {
        remaining.push(item)
      }
    }
    setQueued(remaining)
    writeQueue(remaining)
  }

  React.useEffect(() => {
    function handleOnline() {
      // no-op; consumer should call flush when convenient
    }
    window.addEventListener("online", handleOnline)
    return () => window.removeEventListener("online", handleOnline)
  }, [])

  return { queued, enqueue, flush }
}
