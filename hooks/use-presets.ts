"use client"

import * as React from "react"
import type { Preset } from "@/types/premium"

const STORAGE_KEY = "vvm:presets"

function load(): Preset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Preset[]
  } catch {
    return []
  }
}

function saveAll(presets: Preset[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
  } catch {
    // ignore
  }
}

export function usePresets() {
  const [presets, setPresets] = React.useState<Preset[]>([])

  React.useEffect(() => {
    setPresets(load())
  }, [])

  function addPreset(p: Omit<Preset, "id" | "createdAt">) {
    const newPreset: Preset = { ...p, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    const next = [newPreset, ...presets]
    setPresets(next)
    saveAll(next)
    return newPreset
  }

  function removePreset(id: string) {
    const next = presets.filter((p) => p.id !== id)
    setPresets(next)
    saveAll(next)
  }

  function updatePreset(id: string, patch: Partial<Preset>) {
    const next = presets.map((p) => (p.id === id ? { ...p, ...patch } : p))
    setPresets(next)
    saveAll(next)
  }

  function getPreset(id: string) {
    return presets.find((p) => p.id === id) || null
  }

  return { presets, addPreset, removePreset, updatePreset, getPreset }
}
