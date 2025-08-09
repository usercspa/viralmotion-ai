"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, Sparkles } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

type SiteHeaderProps = {
  ctaHref?: string
  className?: string
  onSignInClick?: () => void
  onSignUpClick?: () => void
}

export function SiteHeader({
  ctaHref = "/auth/sign-up",
  className = "",
  onSignInClick,
  onSignUpClick,
}: SiteHeaderProps) {
  const [open, setOpen] = useState(false)

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-white/10 backdrop-blur supports-[backdrop-filter]:bg-black/40",
        className,
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-indigo-600">
            <Sparkles className="size-4 text-white" aria-hidden="true" />
          </div>
          <span className="text-base font-semibold tracking-tight text-white">Viral Video Maker</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-white/80 md:flex">
          <a href="#features" className="hover:text-white">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-white">
            How it works
          </a>
          <a href="#pricing" className="hover:text-white">
            Pricing
          </a>
          <div className="ml-2 flex items-center gap-2">
            <Button
              variant="ghost"
              className="text-white/90 hover:bg-white/10 hover:text-white"
              onClick={onSignInClick}
              asChild={!onSignInClick}
            >
              {onSignInClick ? <span>Sign in</span> : <Link href="/auth/sign-in">Sign in</Link>}
            </Button>
            <Button
              onClick={onSignUpClick}
              asChild={!onSignUpClick}
              className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 text-white transition-transform hover:scale-[1.02] hover:from-violet-500 hover:to-indigo-500"
            >
              {onSignUpClick ? (
                <span className="relative">Get started</span>
              ) : (
                <Link href={ctaHref} className="relative">
                  Get started
                </Link>
              )}
            </Button>
          </div>
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="text-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <Menu className="size-5" />
        </Button>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="border-t border-white/10 px-4 pb-4 pt-2 md:hidden">
          <div className="flex flex-col gap-2">
            <a href="#features" className="rounded-md px-2 py-2 text-white/90 hover:bg-white/10 hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="rounded-md px-2 py-2 text-white/90 hover:bg-white/10 hover:text-white">
              How it works
            </a>
            <a href="#pricing" className="rounded-md px-2 py-2 text-white/90 hover:bg-white/10 hover:text-white">
              Pricing
            </a>
            <div className="mt-2 flex items-center gap-2">
              <Button
                variant="ghost"
                className="flex-1 text-white/90 hover:bg-white/10 hover:text-white"
                onClick={onSignInClick}
                asChild={!onSignInClick}
              >
                {onSignInClick ? <span>Sign in</span> : <Link href="/auth/sign-in">Sign in</Link>}
              </Button>
              <Button
                onClick={onSignUpClick}
                asChild={!onSignUpClick}
                className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500"
              >
                {onSignUpClick ? <span>Get started</span> : <Link href="/auth/sign-up">Get started</Link>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
