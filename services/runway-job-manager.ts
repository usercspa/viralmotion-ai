// RunwayJobManager: explicit polling control and recovery helpers.

import { getRunwayService } from "@/services/runway-service-singleton"
import { getJobStore } from "@/lib/job-store"
import { nextBackoff, resetBackoff } from "@/lib/backoff"

export class RunwayJobManager {
  private pollingJobs = new Map<string, ReturnType<typeof setInterval>>()

  private calculatePollInterval(jobId: string): number {
    const store = getJobStore()
    const rec = store.jobs.get(jobId)
    if (!rec) return 2500
    if (!rec.backoff) rec.backoff = resetBackoff()
    return Math.min(30_000, rec.backoff.nextDelayMs || 2500)
  }

  private async checkJobStatus(jobId: string) {
    const service = getRunwayService()
    return await service.getJob(jobId)
  }

  private async handleStatusUpdate(_jobId: string, _status: any) {
    // service.getJob already updates the store.
    return
  }

  private handlePollingError(jobId: string, _error: any) {
    const store = getJobStore()
    const rec = store.jobs.get(jobId)
    if (rec) {
      rec.backoff = nextBackoff(rec.backoff, 1500, 1.6, 30_000)
      rec.nextPollAt = Date.now() + (rec.backoff?.nextDelayMs ?? 2500)
    }
  }

  startPolling(jobId: string): void {
    if (this.pollingJobs.has(jobId)) return

    const pollInterval = this.calculatePollInterval(jobId)
    const timer = setInterval(async () => {
      try {
        const status = await this.checkJobStatus(jobId)
        await this.handleStatusUpdate(jobId, status)
        if (["SUCCEEDED", "FAILED", "CANCELLED"].includes(status.status)) {
          this.stopPolling(jobId)
        } else {
          const next = this.calculatePollInterval(jobId)
          if (next > pollInterval) {
            this.stopPolling(jobId)
            this.startPolling(jobId)
          }
        }
      } catch (error) {
        this.handlePollingError(jobId, error)
      }
    }, pollInterval)

    this.pollingJobs.set(jobId, timer)
  }

  stopPolling(jobId: string): void {
    const timer = this.pollingJobs.get(jobId)
    if (timer) {
      clearInterval(timer)
      this.pollingJobs.delete(jobId)
    }
  }

  stopAll(): void {
    for (const [id, t] of this.pollingJobs) {
      clearInterval(t)
      this.pollingJobs.delete(id)
    }
  }

  resumeAllInProgress(): number {
    const store = getJobStore()
    let started = 0
    for (const [id, rec] of store.jobs) {
      if (!rec.done && !this.pollingJobs.has(id)) {
        this.startPolling(id)
        started++
      }
    }
    return started
  }
}

let _mgr: RunwayJobManager | null = null
export function getRunwayJobManager() {
  if (!_mgr) _mgr = new RunwayJobManager()
  return _mgr
}
