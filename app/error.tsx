"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body className="min-h-screen bg-[#0B0B0F] text-white">
        <div className="mx-auto grid min-h-screen max-w-lg place-items-center p-6 text-center">
          <div>
            <h1 className="text-3xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-white/70">An unexpected error occurred. Try again or go back home.</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <Button onClick={() => reset()} className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
                Retry
              </Button>
              <Button variant="outline" className="border-white/15 bg-white/5 text-white hover:bg-white/10" asChild>
                <a href="/">Go home</a>
              </Button>
            </div>
            {error?.digest ? <p className="mt-3 text-xs text-white/40">Ref: {error.digest}</p> : null}
          </div>
        </div>
      </body>
    </html>
  )
}
