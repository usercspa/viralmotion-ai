"use client"

import * as React from "react"

function contrastRatio(hex1: string, hex2: string) {
  function luminance(hex: string) {
    const v = hex.replace("#", "")
    if (v.length !== 6) return 1
    const r = Number.parseInt(v.slice(0, 2), 16) / 255
    const g = Number.parseInt(v.slice(2, 4), 16) / 255
    const b = Number.parseInt(v.slice(4, 6), 16) / 255
    const a = [r, g, b].map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]
  }
  const L1 = luminance(hex1)
  const L2 = luminance(hex2)
  const [max, min] = L1 > L2 ? [L1, L2] : [L2, L1]
  return (max + 0.05) / (min + 0.05)
}

export function BrandCheck({ bg, text }: { bg: string; text: string }) {
  const cr = React.useMemo(() => contrastRatio(bg, text), [bg, text])
  const pass = cr >= 4.5
  return (
    <div
      className={`rounded-md border p-3 text-xs ${
        pass
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
          : "border-amber-500/20 bg-amber-500/10 text-amber-200"
      }`}
    >
      {pass
        ? "Brand compliance: Contrast looks good."
        : "Brand compliance: Low contrast detected. Consider a lighter text color for readability."}
      <span className="ml-2 opacity-70">CR ~ {cr.toFixed(2)}</span>
    </div>
  )
}
