// Tracks API usage per key and per user. Replace with persistent store in prod.

type KeyUsage = {
  key: string
  calls: number
  lastUsedAt?: number
}
const KEYS: KeyUsage[] = []

export function setApiKeys(keys: string[]) {
  KEYS.length = 0
  keys.forEach((k) => KEYS.push({ key: k.trim(), calls: 0 }))
}

let rrIndex = 0

export function getNextApiKey(): string {
  if (KEYS.length === 0) {
    throw new Error("No API keys configured for Runway")
  }
  rrIndex = (rrIndex + 1) % KEYS.length
  const k = KEYS[rrIndex]
  k.calls += 1
  k.lastUsedAt = Date.now()
  return k.key
}

export function getKeyUsage() {
  return KEYS.map((k) => ({ key: maskKey(k.key), calls: k.calls, lastUsedAt: k.lastUsedAt }))
}

function maskKey(k: string) {
  if (k.length <= 8) return "****"
  return `${k.slice(0, 4)}****${k.slice(-4)}`
}
