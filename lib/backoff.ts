// Simple exponential backoff helpers

export type BackoffState = {
  attempts: number
  nextDelayMs: number
}

export function resetBackoff(baseMs = 1500): BackoffState {
  return { attempts: 0, nextDelayMs: baseMs }
}

export function nextBackoff(prev?: BackoffState, baseMs = 1500, factor = 1.6, maxMs = 30_000): BackoffState {
  const attempts = (prev?.attempts ?? 0) + 1
  const next = Math.min(maxMs, Math.round((prev?.nextDelayMs ?? baseMs) * factor))
  return { attempts, nextDelayMs: next }
}
