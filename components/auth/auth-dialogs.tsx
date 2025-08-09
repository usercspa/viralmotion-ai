"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type ModalsProps = {
  openSignIn: boolean
  onOpenSignInChange: (open: boolean) => void
  openSignUp: boolean
  onOpenSignUpChange: (open: boolean) => void
  openForgot: boolean
  onOpenForgotChange: (open: boolean) => void
}

export function AuthModals({
  openSignIn,
  onOpenSignInChange,
  openSignUp,
  onOpenSignUpChange,
  openForgot,
  onOpenForgotChange,
}: ModalsProps) {
  return (
    <>
      <SignInDialog
        open={openSignIn}
        onOpenChange={onOpenSignInChange}
        onForgot={() => {
          onOpenSignInChange(false)
          onOpenForgotChange(true)
        }}
        onGoToSignUp={() => {
          onOpenSignInChange(false)
          onOpenSignUpChange(true)
        }}
      />
      <SignUpDialog
        open={openSignUp}
        onOpenChange={onOpenSignUpChange}
        onGoToSignIn={() => {
          onOpenSignUpChange(false)
          onOpenSignInChange(true)
        }}
      />
      <ForgotPasswordDialog
        open={openForgot}
        onOpenChange={onOpenForgotChange}
        onGoToSignIn={() => {
          onOpenForgotChange(false)
          onOpenSignInChange(true)
        }}
      />
    </>
  )
}

function SignInDialog({
  open,
  onOpenChange,
  onForgot,
  onGoToSignUp,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onForgot: () => void
  onGoToSignUp: () => void
}) {
  const { signIn } = useAuth()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string>("")
  const emailRef = React.useRef<HTMLInputElement>(null)
  const passRef = React.useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const email = emailRef.current?.value.trim() || ""
    const password = passRef.current?.value || ""
    if (!email || !password) return setError("Please fill out all fields.")
    if (!/\S+@\S+\.\S+/.test(email)) return setError("Please enter a valid email.")
    setLoading(true)
    try {
      await signIn(email, password)
      onOpenChange(false)
    } catch (err: any) {
      setError(err?.message || "Unable to sign in.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#0B0B0F] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in</DialogTitle>
          <DialogDescription className="text-white/60">
            Welcome back — continue creating viral videos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-300">{error}</p>}
          <div className="grid gap-2">
            <Label htmlFor="signin-email">Email</Label>
            <Input
              id="signin-email"
              type="email"
              placeholder="you@company.com"
              className="bg-white/5 text-white placeholder:text-white/40"
              ref={emailRef}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="signin-password">Password</Label>
            <Input
              id="signin-password"
              type="password"
              placeholder="••••••••"
              className="bg-white/5 text-white placeholder:text-white/40"
              ref={passRef}
              required
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <button type="button" onClick={onForgot} className="text-violet-300 hover:text-violet-200">
              Forgot password?
            </button>
            <span className="text-white/60">
              New here?{" "}
              <button type="button" className="text-violet-300 hover:text-violet-200" onClick={onGoToSignUp}>
                Create an account
              </button>
            </span>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Sign in"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SignUpDialog({
  open,
  onOpenChange,
  onGoToSignIn,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onGoToSignIn: () => void
}) {
  const { signUp } = useAuth()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string>("")
  const [role, setRole] = React.useState<"founder" | "business_owner" | "marketing_manager">("founder")

  const nameRef = React.useRef<HTMLInputElement>(null)
  const emailRef = React.useRef<HTMLInputElement>(null)
  const passRef = React.useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const name = nameRef.current?.value.trim() || ""
    const email = emailRef.current?.value.trim() || ""
    const password = passRef.current?.value || ""
    if (!name || !email || !password) return setError("Please fill out all fields.")
    if (!/\S+@\S+\.\S+/.test(email)) return setError("Please enter a valid email.")
    if (password.length < 8) return setError("Password must be at least 8 characters.")
    setLoading(true)
    try {
      await signUp({ email, password, name, role })
      onOpenChange(false)
    } catch (err: any) {
      setError(err?.message || "Unable to sign up.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#0B0B0F] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create your account</DialogTitle>
          <DialogDescription className="text-white/60">Start generating scripts and videos with AI.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-300">{error}</p>}
          <div className="grid gap-2">
            <Label htmlFor="signup-name">Full name</Label>
            <Input
              id="signup-name"
              placeholder="Alex Founder"
              className="bg-white/5 text-white placeholder:text-white/40"
              ref={nameRef}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="you@company.com"
              className="bg-white/5 text-white placeholder:text-white/40"
              ref={emailRef}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input
              id="signup-password"
              type="password"
              placeholder="At least 8 characters"
              className="bg-white/5 text-white placeholder:text-white/40"
              ref={passRef}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Role</Label>
            <RadioGroup
              value={role}
              onValueChange={(v) => setRole(v as "founder" | "business_owner" | "marketing_manager")}
              className="grid gap-2 sm:grid-cols-3"
            >
              {[
                { label: "Founder", value: "founder" as const },
                { label: "Business owner", value: "business_owner" as const },
                { label: "Marketing manager", value: "marketing_manager" as const },
              ].map((opt) => {
                const selected = role === opt.value
                return (
                  <div
                    key={opt.value}
                    className={cn(
                      "group relative rounded-md border p-0 transition",
                      "focus-within:ring-2 focus-within:ring-violet-500/50",
                      selected
                        ? "border-violet-500/40 bg-violet-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10",
                    )}
                    aria-selected={selected}
                  >
                    {/* Keep the radio for accessibility; hide visually but keep focusable */}
                    <RadioGroupItem id={`role-${opt.value}`} value={opt.value} className="peer sr-only" />
                    <Label
                      htmlFor={`role-${opt.value}`}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-2 rounded-md p-2 text-sm",
                        "transition-all duration-150",
                        "active:scale-[0.98]",
                        "group-hover:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
                        "peer-data-[state=checked]:text-white",
                      )}
                    >
                      <span
                        className={cn("inline-block size-2 rounded-full", selected ? "bg-violet-400" : "bg-white/40")}
                        aria-hidden="true"
                      />
                      <span>{opt.label}</span>
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          </div>
          <p className="text-xs text-white/60">
            By creating an account, you agree to our{" "}
            <Link className="text-violet-300 hover:text-violet-200" href="#">
              Terms
            </Link>{" "}
            and{" "}
            <Link className="text-violet-300 hover:text-violet-200" href="#">
              Privacy Policy
            </Link>
            .
          </p>
          <DialogFooter>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Create account"}
            </Button>
          </DialogFooter>
        </form>
        <div className="mt-2 text-center text-sm text-white/70">
          Already have an account?{" "}
          <button type="button" className="text-violet-300 hover:text-violet-200" onClick={onGoToSignIn}>
            Sign in
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ForgotPasswordDialog({
  open,
  onOpenChange,
  onGoToSignIn,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onGoToSignIn: () => void
}) {
  const { requestPasswordReset } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string>("")
  const emailRef = React.useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const email = emailRef.current?.value.trim() || ""
    if (!email) return setError("Please enter your email.")
    if (!/\S+@\S+\.\S+/.test(email)) return setError("Please enter a valid email.")
    setLoading(true)
    try {
      await requestPasswordReset(email)
      toast({
        title: "Reset link sent",
        description: "Check your inbox for the password reset link.",
      })
      onOpenChange(false)
    } catch (err: any) {
      setError(err?.message || "Unable to process request.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#0B0B0F] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset your password</DialogTitle>
          <DialogDescription className="text-white/60">
            Enter your email and we’ll send you a reset link.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-300">{error}</p>}
          <div className="grid gap-2">
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              type="email"
              placeholder="you@company.com"
              className="bg-white/5 text-white placeholder:text-white/40"
              ref={emailRef}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : "Send reset link"}
            </Button>
          </DialogFooter>
        </form>
        <div className="mt-2 text-center text-sm text-white/70">
          Remembered your password?{" "}
          <button type="button" className="text-violet-300 hover:text-violet-200" onClick={onGoToSignIn}>
            Sign in
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
