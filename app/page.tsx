"use client"

import { SiteHeader } from "@/components/site-header"
import { Hero } from "@/components/marketing/hero"
import { Features } from "@/components/marketing/features"
import { SocialProof } from "@/components/marketing/social-proof"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AuthProvider } from "@/hooks/use-auth"
import { AuthModals } from "@/components/auth/auth-dialogs"
import { Toaster } from "@/components/ui/toaster"
import * as React from "react"

export default function LandingPage() {
  const [openSignIn, setOpenSignIn] = React.useState(false)
  const [openSignUp, setOpenSignUp] = React.useState(false)
  const [openForgot, setOpenForgot] = React.useState(false)

  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#0B0B0F] text-white">
        <SiteHeader onSignInClick={() => setOpenSignIn(true)} onSignUpClick={() => setOpenSignUp(true)} />
        <main>
          <Hero onSignUp={() => setOpenSignUp(true)} onSignIn={() => setOpenSignIn(true)} />
          <Features />
          <SocialProof />

          <section id="how-it-works" className="mx-auto max-w-7xl px-4 pb-24">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center md:p-10">
              <h3 className="text-2xl font-semibold">Ready to make your first viral video?</h3>
              <p className="mt-2 text-white/70">
                Sign up free and turn your product into content that grows your business.
              </p>
              <div className="mt-5">
                <Button
                  onClick={() => setOpenSignUp(true)}
                  className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 text-white transition-transform hover:scale-[1.03] hover:from-violet-500 hover:to-indigo-500"
                >
                  Get started
                </Button>
              </div>
            </div>
          </section>

          <footer className="border-t border-white/10 py-10">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-white/60 md:flex-row">
              <p>© {new Date().getFullYear()} Viral Video Maker</p>
              <nav className="flex items-center gap-4">
                <Link href="#" className="hover:text-white">
                  Privacy
                </Link>
                <Link href="#" className="hover:text-white">
                  Terms
                </Link>
                <Link href="#" className="hover:text-white">
                  Contact
                </Link>
              </nav>
            </div>
          </footer>
        </main>
      </div>

      <AuthModals
        openSignIn={openSignIn}
        onOpenSignInChange={setOpenSignIn}
        openSignUp={openSignUp}
        onOpenSignUpChange={setOpenSignUp}
        openForgot={openForgot}
        onOpenForgotChange={setOpenForgot}
      />
      <Toaster />
    </AuthProvider>
  )
}
