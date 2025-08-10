// In-memory smart queue with simple concurrency and backoff.

type Task<T = any> = {
  id: string
  body: any
  ownerId: string
  run: () => Promise<T>
  resolve: (v: T | PromiseLike<T>) => void
  reject: (e: any) => void
}

class SmartQueue {
  private concurrency: number
  private active = 0
  private q: Task[] = []
  private listeners: Set<() => void> = new Set()

  constructor(concurrency = 2) {
    this.concurrency = concurrency
  }

  get length() {
    return this.q.length
  }
  get running() {
    return this.active
  }

  onChange(cb: () => void) {
    this.listeners.add(cb)
    return () => this.listeners.delete(cb)
  }

  enqueue<T>(task: Omit<Task<T>, "resolve" | "reject">): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const t: Task<T> = { ...task, resolve, reject }
      this.q.push(t)
      this.tick()
      this.emit()
    })
  }

  private emit() {
    for (const l of this.listeners) l()
  }

  private tick() {
    if (this.active >= this.concurrency) return
    const next = this.q.shift()
    if (!next) return
    this.active++
    ;(async () => {
      try {
        const res = await next.run()
        next.resolve(res)
      } catch (e) {
        next.reject(e)
      } finally {
        this.active--
        this.emit()
        // schedule next microtask
        setTimeout(() => this.tick(), 0)
      }
    })()
  }

  stats() {
    return { queued: this.length, running: this.running }
  }
}

let instance: SmartQueue | null = null
export function getQueue() {
  if (!instance) instance = new SmartQueue(2)
  return instance
}
