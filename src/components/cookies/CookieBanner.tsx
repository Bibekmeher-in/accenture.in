"use client"

import { useSyncExternalStore, useCallback } from "react"
import { Button } from "@/components/ui/Button"

interface CookieSettings {
  enabled: boolean
  bannerText: string
  privacyPolicyUrl: string
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {}
  window.addEventListener("cookie_consent_accepted", callback)
  window.addEventListener("cookie_consent_declined", callback)
  window.addEventListener("storage", callback)
  return () => {
    window.removeEventListener("cookie_consent_accepted", callback)
    window.removeEventListener("cookie_consent_declined", callback)
    window.removeEventListener("storage", callback)
  }
}

function getSnapshot() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("cookie_consent")
}

function getServerSnapshot() {
  return null
}

export function CookieBanner({ settings }: { settings: CookieSettings }) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const consent = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const acceptCookies = useCallback(() => {
    localStorage.setItem("cookie_consent", "accepted")
    window.dispatchEvent(new Event("cookie_consent_accepted"))
  }, [])

  const declineCookies = useCallback(() => {
    localStorage.setItem("cookie_consent", "declined")
    window.dispatchEvent(new Event("cookie_consent_declined"))
  }, [])

  if (!mounted || !settings.enabled || consent) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 sm:pb-4 pointer-events-none">
      <div className="max-w-4xl mx-auto bg-background border border-border shadow-2xl rounded-xl p-6 pointer-events-auto flex flex-col sm:flex-row items-center gap-6 justify-between animate-in slide-in-from-bottom-5">
        <div className="flex-1 text-sm text-foreground">
          {settings.bannerText}{" "}
          <a href={settings.privacyPolicyUrl} className="text-primary hover:underline font-medium">
            Read our Privacy Policy.
          </a>
        </div>
        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={declineCookies}>
            Decline
          </Button>
          <Button variant="default" className="flex-1 sm:flex-none" onClick={acceptCookies}>
            Accept Cookies
          </Button>
        </div>
      </div>
    </div>
  )
}
