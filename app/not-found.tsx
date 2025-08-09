"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-2xl place-items-center p-6 text-center text-white">
      <div>
        <p className="text-sm text-white/60">404</p>
        <h1 className="mt-1 text-3xl font-semibold">Page not found</h1>
        <p className="mt-2 text-white/70">The page you are looking for doesn’t exist or has been moved.</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white" asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
          <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
