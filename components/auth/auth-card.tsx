"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff } from "lucide-react"

type Mode = "sign-in" | "sign-up"

type AuthCardProps = {
  mode?: Mode
  onSubmit?: (payload: { name?: string; company?: string; email: string; password: string }) => Promise<void> | void
  isLoading?: boolean
  error?: string
}

export function AuthCard({
  mode = "sign-in",
  onSubmit = async () => {},
  isLoading = false,
  error = "",
}: AuthCardProps) {
  const [showPass, setShowPass] = React.useState(false)
  const [formError, setFormError] = React.useState<string>("")
  const nameRef = React.useRef<HTMLInputElement>(null)
  const companyRef = React.useRef<HTMLInputElement>(null)
  const emailRef = React.useRef<HTMLInputElement>(null)
  const passRef = React.useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError("")
    const email = emailRef.current?.value?.trim() || ""
    const password = passRef.current?.value || ""
    const name = nameRef.current?.value?.trim()
    const company = companyRef.current?.value?.trim()
    if (!email || !password) {
      setFormError("Please fill out all required fields.")
      return
    }
    if (mode === "sign-up" && password.length < 8) {
      setFormError("Password must be at least 8 characters.")
      return
    }
    await onSubmit({ name, company, email, password })
  }

  return (
    <Card className="border-white/10 bg-white/[0.04] text-white backdrop-blur">
      <CardHeader>
        <CardTitle>{mode === "sign-in" ? "Welcome back" : "Create your account"}</CardTitle>
        <CardDescription className="text-white/60">
          {mode === "sign-in"
            ? "Sign in to start creating viral videos."
            : "Sign up to generate scripts and videos with AI."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!!(formError || error) && (
          <Alert variant="destructive" className="mb-4 border-red-500/30 bg-red-500/10 text-red-200">
            <AlertDescription>{formError || error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "sign-up" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  ref={nameRef}
                  placeholder="Alex Founder"
                  className="bg-white/5 text-white placeholder:text-white/40"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company">Company (optional)</Label>
                <Input
                  id="company"
                  ref={companyRef}
                  placeholder="Acme Co."
                  className="bg-white/5 text-white placeholder:text-white/40"
                />
              </div>
            </>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              ref={emailRef}
              placeholder="you@company.com"
              required
              className="bg-white/5 text-white placeholder:text-white/40"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPass ? "text" : "password"}
                ref={passRef}
                required
                className="bg-white/5 pr-10 text-white placeholder:text-white/40"
                placeholder={mode === "sign-up" ? "At least 8 characters" : "••••••••"}
              />
              <button
                type="button"
                aria-label={showPass ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 grid w-10 place-items-center text-white/60 hover:text-white"
                onClick={() => setShowPass((v) => !v)}
              >
                {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500"
          >
            {isLoading ? "Please wait..." : mode === "sign-in" ? "Sign in" : "Create account"}
          </Button>

          <div className="text-center text-sm text-white/70">
            {mode === "sign-in" ? (
              <>
                New here?{" "}
                <Link href="/auth/sign-up" className="text-violet-300 hover:text-violet-200">
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link href="/auth/sign-in" className="text-violet-300 hover:text-violet-200">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
