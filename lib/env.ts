// Centralized environment accessors.
// Note: Keep API keys server-side only (Route Handlers / Server Actions).

export function getRunwayApiKey(): string {
  const key = process.env.RUNWAY_API_KEY
  return key || ""
}
