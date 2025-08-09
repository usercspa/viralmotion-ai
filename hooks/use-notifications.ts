"use client"

import * as React from "react"

export function useNotifications() {
  const [supported, setSupported] = React.useState(false)
  const [permission, setPermission] = React.useState<NotificationPermission>("default")

  React.useEffect(() => {
    const ok = typeof window !== "undefined" && "Notification" in window
    setSupported(ok)
    if (ok) setPermission(Notification.permission)
  }, [])

  async function requestPermission() {
    if (!supported) return "denied" as const
    const perm = await Notification.requestPermission()
    setPermission(perm)
    return perm
  }

  function notify(title: string, options?: NotificationOptions) {
    if (!supported) return
    if (permission === "granted") {
      // eslint-disable-next-line no-new
      new Notification(title, options)
    }
  }

  return { supported, permission, requestPermission, notify }
}
