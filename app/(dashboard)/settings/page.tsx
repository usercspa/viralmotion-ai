"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import {
  AlertCircle,
  Bird,
  Check,
  Globe,
  Instagram,
  Link2,
  Linkedin,
  Loader2,
  Lock,
  LogOut,
  Music2,
  Sparkles,
  Trash2,
  User2,
  Youtube,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Platform = "Instagram" | "TikTok" | "YouTube" | "LinkedIn" | "Facebook" | "Twitter"

const STORAGE_BRAND = "vvm:brandKit"
const STORAGE_CONNECTIONS = "vvm:connections"
const STORAGE_NOTIFS = "vvm:notifications"
const STORAGE_BILLING = "vvm:billing"

type BrandKit = {
  brandName: string
  tagline: string
  primary: string
  secondary: string
  font: string
  industry: string
  logoUrl?: string | null
}

type Connection = {
  id: string
  platform: Platform
  username: string
  connected: boolean
  lastUsed: string // ISO
}

type NotificationPrefs = {
  emailProductUpdates: boolean
  emailTips: boolean
  emailPublishConfirm: boolean
  pushEnabled: boolean
  frequency: "immediate" | "daily" | "weekly"
}

type BillingState = {
  plan: "Starter" | "Pro" | "Enterprise"
  usage: {
    minutesThisMonth: number
    minutesLimit: number
    videosThisMonth: number
    videosLimit: number
  }
  history: Array<{
    id: string
    date: string
    description: string
    amount: string
    status: "paid" | "due" | "refunded"
  }>
}

const defaultBrandKit: BrandKit = {
  brandName: "",
  tagline: "",
  primary: "#7c3aed", // violet-600
  secondary: "#4f46e5", // indigo-600
  font: "Manrope",
  industry: "SaaS",
  logoUrl: null,
}

const defaultConnections: Connection[] = [
  {
    id: crypto.randomUUID(),
    platform: "Instagram",
    username: "@yourbrand",
    connected: true,
    lastUsed: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    platform: "YouTube",
    username: "@yourbrand",
    connected: true,
    lastUsed: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    platform: "LinkedIn",
    username: "Your Brand",
    connected: false,
    lastUsed: new Date(Date.now() - 86400000).toISOString(),
  },
]

const defaultNotifs: NotificationPrefs = {
  emailProductUpdates: true,
  emailTips: true,
  emailPublishConfirm: true,
  pushEnabled: false,
  frequency: "weekly",
}

const defaultBilling: BillingState = {
  plan: "Starter",
  usage: {
    minutesThisMonth: 86,
    minutesLimit: 120,
    videosThisMonth: 9,
    videosLimit: 15,
  },
  history: [
    {
      id: "inv_001",
      date: new Date(Date.now() - 31 * 86400000).toISOString(),
      description: "Starter Plan - Jul",
      amount: "$0.00",
      status: "paid",
    },
    {
      id: "inv_002",
      date: new Date(Date.now() - 61 * 86400000).toISOString(),
      description: "Starter Plan - Jun",
      amount: "$0.00",
      status: "paid",
    },
  ],
}

const platformColors: Record<Platform, string> = {
  Instagram: "#E1306C",
  TikTok: "#29B6F6",
  YouTube: "#FF0000",
  LinkedIn: "#0A66C2",
  Facebook: "#1877F2",
  Twitter: "#1DA1F2",
}

const fontStacks: Record<string, string> = {
  Manrope: 'Manrope, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Inter, Arial',
  "Space Grotesk": 'Space Grotesk, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Inter, Arial',
  Inter: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial',
  Poppins: 'Poppins, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial',
  Roboto: 'Roboto, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Arial',
}

function useLocalStorageState<T>(key: string, initial: T) {
  const [state, setState] = React.useState<T>(initial)
  React.useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem(key)
      if (raw) setState(JSON.parse(raw))
    } catch {}
  }, [key])
  const save = React.useCallback(
    (next: T) => {
      setState(next)
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {}
    },
    [key],
  )
  return [state, save] as const
}

export default function SettingsPage() {
  const { toast } = useToast()
  const { user, updateProfile, signOut } = useAuth()
  const [tab, setTab] = React.useState("brand")

  // Brand kit state
  const [brand, setBrand] = useLocalStorageState<BrandKit>(STORAGE_BRAND, defaultBrandKit)
  const [brandSaving, setBrandSaving] = React.useState(false)
  const [dragActive, setDragActive] = React.useState(false)

  // Account settings
  const [name, setName] = React.useState(user?.name ?? "")
  const [email, setEmail] = React.useState(user?.email ?? "")
  const [role, setRole] = React.useState(user?.role ?? "founder")
  const [oldPass, setOldPass] = React.useState("")
  const [newPass, setNewPass] = React.useState("")
  const [confirmPass, setConfirmPass] = React.useState("")
  const [profileSaving, setProfileSaving] = React.useState(false)
  const [passwordSaving, setPasswordSaving] = React.useState(false)
  const [openDelete, setOpenDelete] = React.useState(false)
  const [deleteConfirm, setDeleteConfirm] = React.useState("")

  // Social accounts
  const [connections, setConnections] = useLocalStorageState<Connection[]>(STORAGE_CONNECTIONS, defaultConnections)
  const [connecting, setConnecting] = React.useState<Record<Platform, boolean>>({} as any)

  // Notifications
  const [notifs, setNotifs] = useLocalStorageState<NotificationPrefs>(STORAGE_NOTIFS, defaultNotifs)
  const [notifSaving, setNotifSaving] = React.useState(false)

  // Billing
  const [billing, setBilling] = useLocalStorageState<BillingState>(STORAGE_BILLING, defaultBilling)
  const [changingPlan, setChangingPlan] = React.useState<"Starter" | "Pro" | "Enterprise" | null>(null)

  // Handlers
  async function saveBrand() {
    if (!brand.brandName.trim()) {
      toast({
        title: "Brand name required",
        description: "Please enter your company or brand name.",
        variant: "destructive",
      })
      return
    }
    setBrandSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    setBrand(brand)
    setBrandSaving(false)
    toast({ title: "Brand kit saved", description: "Your brand kit has been updated." })
  }

  async function saveProfile() {
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast({ title: "Invalid email", description: "Please provide a valid email address.", variant: "destructive" })
      return
    }
    setProfileSaving(true)
    try {
      await updateProfile({ name, email, role: role as any })
      toast({ title: "Profile updated", description: "Your account details have been saved." })
    } finally {
      setProfileSaving(false)
    }
  }

  async function changePassword() {
    if (!oldPass || !newPass || !confirmPass) {
      toast({ title: "Missing fields", description: "Fill out all password fields.", variant: "destructive" })
      return
    }
    if (newPass.length < 8) {
      toast({ title: "Weak password", description: "Use at least 8 characters.", variant: "destructive" })
      return
    }
    if (newPass !== confirmPass) {
      toast({
        title: "Password mismatch",
        description: "New password and confirmation must match.",
        variant: "destructive",
      })
      return
    }
    setPasswordSaving(true)
    await new Promise((r) => setTimeout(r, 900))
    setOldPass("")
    setNewPass("")
    setConfirmPass("")
    setPasswordSaving(false)
    toast({ title: "Password changed", description: "Your password has been updated." })
  }

  async function confirmDelete() {
    if (!user?.email || deleteConfirm.trim().toLowerCase() !== user.email.toLowerCase()) {
      toast({
        title: "Confirmation mismatch",
        description: "Type your email to confirm deletion.",
        variant: "destructive",
      })
      return
    }
    // Clear local data
    localStorage.removeItem(STORAGE_BRAND)
    localStorage.removeItem(STORAGE_CONNECTIONS)
    localStorage.removeItem(STORAGE_NOTIFS)
    localStorage.removeItem(STORAGE_BILLING)
    setOpenDelete(false)
    toast({ title: "Account deleted", description: "Your account has been deleted." })
    // Sign out (clears session & navigates home)
    signOut()
  }

  function onDropFile(file: File) {
    const url = URL.createObjectURL(file)
    setBrand({ ...brand, logoUrl: url })
  }

  function disconnect(id: string) {
    setConnections(connections.filter((c) => c.id !== id))
    toast({ title: "Disconnected", description: "The account has been disconnected." })
  }

  function connectPlatform(p: Platform) {
    setConnecting((s) => ({ ...s, [p]: true }))
    setTimeout(() => {
      const username = p === "LinkedIn" ? "Your Brand" : "@yourbrand"
      const next: Connection = {
        id: crypto.randomUUID(),
        platform: p,
        username,
        connected: true,
        lastUsed: new Date().toISOString(),
      }
      setConnections([next, ...connections])
      setConnecting((s) => ({ ...s, [p]: false }))
      toast({ title: `${p} connected`, description: `Connected as ${username}.` })
    }, 900)
  }

  async function saveNotifications() {
    setNotifSaving(true)
    await new Promise((r) => setTimeout(r, 600))
    setNotifs(notifs)
    setNotifSaving(false)
    toast({ title: "Notification preferences saved" })
  }

  function planBadgeColor(plan: BillingState["plan"]) {
    if (plan === "Starter") return "border-white/15 bg-white/10"
    if (plan === "Pro") return "border-fuchsia-400/30 bg-fuchsia-500/10"
    return "border-amber-400/30 bg-amber-500/10"
  }

  function changePlan(to: BillingState["plan"]) {
    setChangingPlan(to)
    setTimeout(() => {
      setBilling({
        ...billing,
        plan: to,
        history: [
          {
            id: `inv_${Math.random().toString(36).slice(2, 8)}`,
            date: new Date().toISOString(),
            description: `${to} Plan`,
            amount: to === "Starter" ? "$0.00" : to === "Pro" ? "$29.00" : "$99.00",
            status: "paid",
          },
          ...billing.history,
        ],
      })
      setChangingPlan(null)
      toast({ title: "Plan updated", description: `You are now on the ${to} plan.` })
    }, 900)
  }

  const usageMinutesPct = Math.min(100, Math.round((billing.usage.minutesThisMonth / billing.usage.minutesLimit) * 100))
  const usageVideosPct = Math.min(100, Math.round((billing.usage.videosThisMonth / billing.usage.videosLimit) * 100))

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your brand, account, integrations, and billing.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn("text-xs", planBadgeColor(billing.plan))}
            aria-label={`Current plan: ${billing.plan}`}
          >
            {billing.plan} Plan
          </Badge>
          <Button
            variant="outline"
            className="border-white/15 bg-white/5 text-white hover:bg-white/10"
            onClick={() => changePlan("Pro")}
            disabled={changingPlan !== null || billing.plan === "Pro"}
          >
            {changingPlan === "Pro" ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            Upgrade to Pro
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 grid w-full grid-cols-5 overflow-x-auto">
          <TabsTrigger value="brand">Brand Kit</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="social">Social Accounts</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        {/* Brand Kit */}
        <TabsContent value="brand" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 border-white/10 bg-white/[0.03]">
              <CardHeader>
                <CardTitle>Brand details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="brandName">Company / Brand name</Label>
                  <Input
                    id="brandName"
                    placeholder="Your Brand Inc."
                    className="bg-white/5 text-white placeholder:text-white/40"
                    value={brand.brandName}
                    onChange={(e) => setBrand({ ...brand, brandName: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tagline">Brand tagline</Label>
                  <Input
                    id="tagline"
                    placeholder="Make content that converts"
                    className="bg-white/5 text-white placeholder:text-white/40"
                    value={brand.tagline}
                    onChange={(e) => setBrand({ ...brand, tagline: e.target.value })}
                  />
                </div>

                {/* Logo upload with drag & drop */}
                <div className="grid gap-2">
                  <Label>Logo</Label>
                  <div
                    className={cn(
                      "relative flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed p-4 text-sm transition",
                      dragActive
                        ? "border-violet-500/50 bg-violet-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10",
                    )}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setDragActive(true)
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault()
                      setDragActive(false)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDragActive(false)
                      const f = e.dataTransfer.files?.[0]
                      if (f && f.type.startsWith("image/")) {
                        onDropFile(f)
                      }
                    }}
                    onClick={() => {
                      const input = document.getElementById("logo-input") as HTMLInputElement | null
                      input?.click()
                    }}
                  >
                    {brand.logoUrl ? (
                      <div className="flex w-full items-center gap-3">
                        <img
                          src={brand.logoUrl || "/placeholder.svg"}
                          alt="Logo preview"
                          className="h-12 w-12 rounded bg-white p-1 object-contain"
                        />
                        <div className="flex-1">
                          <p className="text-white/90">Logo uploaded</p>
                          <p className="text-xs text-white/60">Click to replace</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center text-white/80">
                        <Sparkles className="size-5 text-violet-300" />
                        <p>Drag & drop an image here, or click to upload</p>
                        <p className="text-xs text-white/60">PNG, JPG, SVG up to 5MB</p>
                      </div>
                    )}
                    <input
                      id="logo-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) onDropFile(file)
                      }}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="primary">Primary color</Label>
                    <Input
                      id="primary"
                      type="color"
                      className="h-10 w-24 bg-transparent p-1"
                      value={brand.primary}
                      onChange={(e) => setBrand({ ...brand, primary: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="secondary">Secondary color</Label>
                    <Input
                      id="secondary"
                      type="color"
                      className="h-10 w-24 bg-transparent p-1"
                      value={brand.secondary}
                      onChange={(e) => setBrand({ ...brand, secondary: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Font family</Label>
                    <Select value={brand.font} onValueChange={(v) => setBrand({ ...brand, font: v })}>
                      <SelectTrigger className="border-white/15 bg-white/5 text-white">
                        <SelectValue placeholder="Choose font" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(fontStacks).map((f) => (
                          <SelectItem key={f} value={f}>
                            {f}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Industry</Label>
                    <Select value={brand.industry} onValueChange={(v) => setBrand({ ...brand, industry: v })}>
                      <SelectTrigger className="border-white/15 bg-white/5 text-white">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {["SaaS", "E-commerce", "Creator", "Education", "Health", "Finance", "Agency"].map((i) => (
                          <SelectItem key={i} value={i}>
                            {i}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={saveBrand}
                    disabled={brandSaving}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500"
                  >
                    {brandSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                    Save Brand Kit
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card className="border-white/10 bg-white/[0.03]">
              <CardHeader>
                <CardTitle>Video preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-[9/16] w-full overflow-hidden rounded-lg border border-white/10">
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(180deg, ${brand.primary} 0%, ${brand.secondary} 100%)`,
                      opacity: 0.7,
                    }}
                  />
                  <img
                    src="/video-thumbnail-concept.png?height=720&width=1280&query=brand%20preview"
                    alt="Preview background"
                    className="h-full w-full object-cover opacity-60"
                  />
                  {brand.logoUrl && (
                    <img
                      src={brand.logoUrl || "/placeholder.svg"}
                      alt="Logo"
                      className="absolute left-3 top-3 h-12 w-12 rounded bg-white/10 p-1 object-contain"
                    />
                  )}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div
                      className="inline-block rounded-md px-3 py-2 text-sm shadow backdrop-blur"
                      style={{
                        background: "rgba(0,0,0,0.45)",
                        color: "#fff",
                        fontFamily: fontStacks[brand.font] ?? fontStacks.Manrope,
                      }}
                    >
                      {"Your caption appears here"}
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-xs text-white/60">
                  Preview simulates your brand applied to captions and overlays.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Account Settings */}
        <TabsContent value="account">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-white/10 bg-white/[0.03]">
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    className="bg-white/5 text-white placeholder:text-white/40"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    className="bg-white/5 text-white placeholder:text-white/40"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <Select value={String(role)} onValueChange={(v) => setRole(v as any)}>
                    <SelectTrigger className="border-white/15 bg-white/5 text-white">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="founder">Founder</SelectItem>
                      <SelectItem value="business_owner">Business owner</SelectItem>
                      <SelectItem value="marketing_manager">Marketing manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={saveProfile}
                  disabled={profileSaving}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500"
                >
                  {profileSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <User2 className="mr-2 size-4" />}
                  Save Profile
                </Button>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/[0.03]">
              <CardHeader>
                <CardTitle>Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="old-pass">Current password</Label>
                  <Input
                    id="old-pass"
                    type="password"
                    className="bg-white/5 text-white placeholder:text-white/40"
                    value={oldPass}
                    onChange={(e) => setOldPass(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-pass">New password</Label>
                  <Input
                    id="new-pass"
                    type="password"
                    className="bg-white/5 text-white placeholder:text-white/40"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="At least 8 characters"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-pass">Confirm new password</Label>
                  <Input
                    id="confirm-pass"
                    type="password"
                    className="bg-white/5 text-white placeholder:text-white/40"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                  />
                </div>
                <Button
                  onClick={changePassword}
                  disabled={passwordSaving}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500"
                >
                  {passwordSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Lock className="mr-2 size-4" />}
                  Change Password
                </Button>
                <div className="mt-6 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                  <div className="mb-1 flex items-center gap-2">
                    <AlertCircle className="size-4" />
                    <span>Danger zone</span>
                  </div>
                  <p className="text-amber-100/90">Deleting your account will remove your data permanently.</p>
                  <div className="mt-3">
                    <Button
                      variant="outline"
                      className="border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                      onClick={() => setOpenDelete(true)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Delete confirmation */}
          <Dialog open={openDelete} onOpenChange={setOpenDelete}>
            <DialogContent className="border-white/10 bg-[#0B0B0F] text-white">
              <DialogHeader>
                <DialogTitle>Delete account</DialogTitle>
                <DialogDescription className="text-white/60">
                  This action cannot be undone. Type your email to confirm.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2">
                <Label htmlFor="confirm-del">Email</Label>
                <Input
                  id="confirm-del"
                  placeholder={user?.email}
                  className="bg-white/5 text-white placeholder:text-white/40"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button onClick={confirmDelete} className="bg-red-600 text-white hover:bg-red-500">
                  <Trash2 className="mr-2 size-4" />
                  Confirm delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Social Media Accounts */}
        <TabsContent value="social" className="space-y-6">
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle>Connected accounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {connections.length === 0 ? (
                <p className="text-sm text-white/70">No connected accounts yet.</p>
              ) : (
                connections.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <PlatformIcon platform={c.platform} />
                      <div>
                        <div className="text-sm font-medium">{c.platform}</div>
                        <div className="text-xs text-white/60">
                          {c.username} • Last used {new Date(c.lastUsed).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-xs",
                          c.connected
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-300",
                        )}
                      >
                        {c.connected ? "Connected" : "Disconnected"}
                      </span>
                      <Button
                        variant="outline"
                        className="h-8 border-white/15 bg-white/5 text-white hover:bg-white/10"
                        onClick={() => disconnect(c.id)}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Connect new */}
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle>Connect a new account</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-3">
              {(["Instagram", "TikTok", "YouTube", "LinkedIn", "Facebook", "Twitter"] as Platform[]).map((p) => (
                <Button
                  key={p}
                  variant="outline"
                  className="justify-start gap-2 border-white/15 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => connectPlatform(p)}
                  disabled={!!connecting[p]}
                >
                  {connecting[p] ? <Loader2 className="size-4 animate-spin" /> : <PlatformIcon platform={p} />}
                  {connecting[p] ? `Connecting ${p}…` : `Connect ${p}`}
                </Button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle>Email notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ToggleRow
                id="email-updates"
                label="Product updates"
                checked={notifs.emailProductUpdates}
                onChange={(v) => setNotifs({ ...notifs, emailProductUpdates: v })}
              />
              <ToggleRow
                id="email-tips"
                label="Weekly tips and best practices"
                checked={notifs.emailTips}
                onChange={(v) => setNotifs({ ...notifs, emailTips: v })}
              />
              <ToggleRow
                id="email-publish"
                label="Publish confirmations"
                checked={notifs.emailPublishConfirm}
                onChange={(v) => setNotifs({ ...notifs, emailPublishConfirm: v })}
              />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-white/10 bg-white/[0.03]">
              <CardHeader>
                <CardTitle>Push notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <ToggleRow
                  id="push-enabled"
                  label="Enable push notifications"
                  checked={notifs.pushEnabled}
                  onChange={(v) => setNotifs({ ...notifs, pushEnabled: v })}
                />
                <p className="mt-2 text-xs text-white/60">You may be asked to allow notifications in your browser.</p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/[0.03]">
              <CardHeader>
                <CardTitle>Frequency</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={notifs.frequency}
                  onValueChange={(v) => setNotifs({ ...notifs, frequency: v as any })}
                  className="grid gap-2"
                >
                  {[
                    { v: "immediate", label: "Immediate" },
                    { v: "daily", label: "Daily digest" },
                    { v: "weekly", label: "Weekly summary" },
                  ].map((opt) => (
                    <label
                      key={opt.v}
                      htmlFor={`freq-${opt.v}`}
                      className={cn(
                        "cursor-pointer rounded-md border p-2 text-sm transition",
                        "border-white/10 bg-white/5 hover:bg-white/10",
                        notifs.frequency === opt.v && "border-violet-500/40 bg-violet-500/10",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem id={`freq-${opt.v}`} value={opt.v} />
                        <span>{opt.label}</span>
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          <Button
            onClick={saveNotifications}
            disabled={notifSaving}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500"
          >
            {notifSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}
            Save Preferences
          </Button>
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing" className="space-y-6">
          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle>Current plan</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-md border border-white/10 bg-white/5 p-3">
                <p className="text-sm text-white/80">Plan</p>
                <p className="text-lg font-semibold">{billing.plan}</p>
              </div>
              <div className="rounded-md border border-white/10 bg-white/5 p-3">
                <p className="text-sm text-white/80">Minutes this month</p>
                <UsageBar
                  value={usageMinutesPct}
                  label={`${billing.usage.minutesThisMonth}/${billing.usage.minutesLimit} min`}
                />
              </div>
              <div className="rounded-md border border-white/10 bg-white/5 p-3">
                <p className="text-sm text-white/80">Videos this month</p>
                <UsageBar
                  value={usageVideosPct}
                  label={`${billing.usage.videosThisMonth}/${billing.usage.videosLimit}`}
                />
              </div>
              <div className="sm:col-span-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={() => changePlan("Pro")}
                    disabled={changingPlan !== null || billing.plan === "Pro"}
                    className="bg-gradient-to-r from-fuchsia-600 to-rose-600 text-white hover:from-fuchsia-500 hover:to-rose-500"
                  >
                    {changingPlan === "Pro" ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                    Upgrade to Pro
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => changePlan("Starter")}
                    disabled={changingPlan !== null || billing.plan === "Starter"}
                    className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                  >
                    Downgrade to Starter
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => changePlan("Enterprise")}
                    disabled={changingPlan !== null || billing.plan === "Enterprise"}
                    className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                  >
                    Contact Sales
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle>Billing history</CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billing.history.map((h) => (
                    <TableRow key={h.id} className="border-white/10">
                      <TableCell>{new Date(h.date).toLocaleDateString()}</TableCell>
                      <TableCell>{h.description}</TableCell>
                      <TableCell>{h.amount}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            h.status === "paid"
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                              : h.status === "due"
                                ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                                : "border-sky-500/30 bg-sky-500/10 text-sky-300",
                          )}
                        >
                          {h.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" className="h-8 px-2 text-white hover:bg-white/10">
                          <Link2 className="mr-2 size-4" />
                          Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex items-center justify-end">
        <Button
          variant="outline"
          className="border-white/15 bg-white/5 text-white hover:bg-white/10"
          onClick={() => signOut()}
        >
          <LogOut className="mr-2 size-4" />
          Sign out
        </Button>
      </div>
    </div>
  )
}

function UsageBar({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="h-2 w-full rounded bg-white/10">
        <div
          className="h-2 rounded bg-gradient-to-r from-fuchsia-600 to-rose-600"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          role="progressbar"
        />
      </div>
      <div className="mt-1 text-xs text-white/70">{label}</div>
    </div>
  )
}

function ToggleRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/5 p-2">
      <div className="flex items-center gap-2">
        <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(Boolean(v))} />
        <Label htmlFor={id}>{label}</Label>
      </div>
    </div>
  )
}

function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  const color = platformColors[platform]
  if (platform === "Instagram") return <Instagram className={cn("size-5", className)} color={color} />
  if (platform === "YouTube") return <Youtube className={cn("size-5", className)} color={color} />
  if (platform === "LinkedIn") return <Linkedin className={cn("size-5", className)} color={color} />
  if (platform === "TikTok") return <Music2 className={cn("size-5", className)} color={color} />
  if (platform === "Twitter") return <Bird className={cn("size-5", className)} color={color} />
  // Facebook fallback
  return <Globe className={cn("size-5", className)} color={color} />
}
