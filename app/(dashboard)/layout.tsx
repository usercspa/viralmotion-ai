import type React from "react"
import { StatusBanner } from "@/components/system/status-banner"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <StatusBanner />
      {/* rest of code here */}
      {children}
    </div>
  )
}
