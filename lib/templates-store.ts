// Simple in-memory templates. Replace with DB in production.

export type VideoTemplate = {
  id: string
  name: string
  createdAt: string
  request: Record<string, any>
  lastUsedAt?: string
  ownerId: string
}

const TEMPLATES = new Map<string, VideoTemplate>() // id -> template
const USER_INDEX = new Map<string, Set<string>>() // ownerId -> ids

export function saveTemplate(ownerId: string, name: string, request: Record<string, any>) {
  const id = crypto.randomUUID()
  const tpl: VideoTemplate = { id, name, createdAt: new Date().toISOString(), request, ownerId }
  TEMPLATES.set(id, tpl)
  if (!USER_INDEX.has(ownerId)) USER_INDEX.set(ownerId, new Set())
  USER_INDEX.get(ownerId)!.add(id)
  return tpl
}

export function listTemplates(ownerId: string) {
  const ids = USER_INDEX.get(ownerId) || new Set()
  return Array.from(ids)
    .map((id) => TEMPLATES.get(id)!)
    .filter(Boolean)
}

export function deleteTemplate(ownerId: string, id: string) {
  const tpl = TEMPLATES.get(id)
  if (!tpl || tpl.ownerId !== ownerId) return false
  TEMPLATES.delete(id)
  USER_INDEX.get(ownerId)?.delete(id)
  return true
}
