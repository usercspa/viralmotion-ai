// Simple content policy checker to reduce invalid prompt failures.

export type PolicyCheck = {
  ok: boolean
  sanitizedPrompt: string
  issues: string[]
}

const DISALLOWED = [
  // Example disallowed content categories/keywords
  "hate speech",
  "explicit sexual content",
  "violent gore",
]

const REPLACEMENTS: Record<string, string> = {
  NSFW: "sensitive",
  kill: "defeat",
  murder: "eliminate",
}

const MAX_TOKENS_APPROX = 1200 // rough characters cap for prompts

export function checkPromptPolicy(prompt: string): PolicyCheck {
  const issues: string[] = []
  let sanitized = prompt.trim()

  // length trimming
  if (sanitized.length > MAX_TOKENS_APPROX) {
    issues.push("Prompt is very long and may fail. It was shortened.")
    sanitized = sanitized.slice(0, MAX_TOKENS_APPROX)
  }

  // disallowed keywords detection
  for (const term of DISALLOWED) {
    const re = new RegExp(`\\b${escapeRegExp(term)}\\b`, "i")
    if (re.test(sanitized)) {
      issues.push(`Contains disallowed content: "${term}"`)
    }
  }

  // apply gentle replacements
  for (const [k, v] of Object.entries(REPLACEMENTS)) {
    const re = new RegExp(`\\b${escapeRegExp(k)}\\b`, "ig")
    if (re.test(sanitized)) {
      sanitized = sanitized.replace(re, v)
      issues.push(`Reworded "${k}" to "${v}" for policy compliance`)
    }
  }

  return {
    ok: issues.filter((i) => i.startsWith("Contains disallowed")).length === 0,
    sanitizedPrompt: sanitized,
    issues,
  }
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
