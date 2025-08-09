"use client"

import { AuthCard } from "@/components/auth/auth-card"
import { SiteHeader } from "@/components/site-header"
import { AuthProvider, useAuth } from "@/hooks/use-auth"
import * as React from "react"

function SignUpInner() {
  const { signUp } = useAuth()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white">
      <SiteHeader />
      <main className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-16 md:grid-cols-2">
        <div className="order-2 md:order-1">
          <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <img
              src="/ai-video-maker-brand-kit-dark-ui.png"
              alt="Brand kit and AI video maker preview"
              className="h-full w-full object-cover opacity-90"
            />
          </div>
        </div>
        <div className="order-1 md:order-2">
          <AuthCard
            mode="sign-up"
            isLoading={loading}
            error={error}
            onSubmit={async ({ email, password, name, company }) => {
              try {
                setLoading(true)
                setError("")
                await signUp({ email, password, name, company })
              } catch (e: any) {
                setError(e?.message || "Something went wrong")
              } finally {
                setLoading(false)
              }
            }}
          />
          <p className="mt-4 text-center text-xs text-white/60">
            By creating an account, you agree to our{" "}
            <a className="text-violet-300 hover:text-violet-200" href="#">
              Terms
            </a>{" "}
            and{" "}
            <a className="text-violet-300 hover:text-violet-200" href="#">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <AuthProvider>
      <SignUpInner />
    </AuthProvider>
  )
}
