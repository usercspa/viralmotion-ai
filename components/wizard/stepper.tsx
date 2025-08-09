"use client"

import { cn } from "@/lib/utils"

export type Step = {
  id: number
  title: string
  description?: string
}

export function Stepper({
  steps,
  current,
  onStepClick,
}: {
  steps: Step[]
  current: number
  onStepClick?: (index: number) => void
}) {
  return (
    <ol className="mb-6 grid grid-cols-4 gap-3 sm:gap-4">
      {steps.map((s, idx) => {
        const isActive = idx === current
        const isComplete = idx < current
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onStepClick?.(idx)}
              className={cn(
                "w-full rounded-lg border p-3 text-left transition",
                isActive && "border-violet-500/40 bg-violet-500/10",
                isComplete && !isActive && "border-emerald-500/30 bg-emerald-500/10",
                !isActive && !isComplete && "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
              )}
              aria-current={isActive ? "step" : undefined}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid size-6 place-items-center rounded-full border text-xs",
                    isActive && "border-violet-500/50 bg-violet-500/20 text-violet-200",
                    isComplete && "border-emerald-500/50 bg-emerald-500/20 text-emerald-200",
                    !isActive && !isComplete && "border-white/20 bg-white/[0.06] text-white/80",
                  )}
                >
                  {s.id}
                </span>
                <div>
                  <p className="text-sm font-medium">{s.title}</p>
                  {s.description && <p className="text-xs text-white/60">{s.description}</p>}
                </div>
              </div>
            </button>
          </li>
        )
      })}
    </ol>
  )
}
