// Lightweight fallback generator to keep UX moving during provider outages.
// Simulates success and returns a sample video.

export type FallbackJob = {
  id: string
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED"
  createdAt: string
  output?: string[]
  error?: string
}

const JOBS = new Map<string, FallbackJob>()

export function createFallbackJob(_: any, __: string): FallbackJob {
  const id = `fb_${Math.random().toString(36).slice(2)}`
  const job: FallbackJob = { id, status: "PENDING", createdAt: new Date().toISOString() }
  JOBS.set(id, job)

  // Simulate processing
  setTimeout(() => {
    const running = JOBS.get(id)
    if (!running) return
    running.status = "RUNNING"
    JOBS.set(id, running)
  }, 1000)

  setTimeout(() => {
    const done = JOBS.get(id)
    if (!done) return
    done.status = "SUCCEEDED"
    done.output = ["/sample-preview.mp4"]
    JOBS.set(id, done)
  }, 4000)

  return job
}

export function getFallbackJob(id: string) {
  return JOBS.get(id)
}
