// Premium feature flags and shared types

export interface PremiumFeatures {
  priorityQueue: boolean
  higherQualityOptions: boolean
  batchGeneration: boolean
  advancedControls: boolean
}

export type Preset = {
  id: string
  name: string
  description?: string
  createdAt: string
  // Core generation knobs
  style: "cinematic" | "realistic" | "animated" | "corporate"
  motion: "low" | "medium" | "high"
  camera_movement: "static" | "pan" | "zoom" | "tracking"
  lighting: "natural" | "studio" | "dramatic"
  quality: "standard" | "high"
  negativePrompt?: string
  variationCount?: number
  // Optional brand and ratio hints
  ratio?: "16:9" | "9:16" | "1:1"
  brand?: { primary?: string; secondary?: string; logoUrl?: string | null; font?: string | null } | null
}

export type ABPrompt = {
  a: string
  b: string
}
