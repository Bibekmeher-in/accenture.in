"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

export function AnalyticsTracker() {
  const pathname = usePathname()
  const trackedPages = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Admin Exclusion
    if (pathname && (pathname.startsWith("/admin") || pathname.startsWith("/api/admin"))) {
      return
    }

    const consent = localStorage.getItem("cookie_consent")

    // If consent is withdrawn or not set, clean up tracking identifiers and abort
    if (consent !== "accepted") {
      localStorage.removeItem("analytics_visitor_id")
      sessionStorage.removeItem("analytics_session_id")
      return
    }

    // Get or Create Visitor ID
    let visitorId = localStorage.getItem("analytics_visitor_id")
    if (!visitorId) {
      visitorId = crypto.randomUUID()
      localStorage.setItem("analytics_visitor_id", visitorId)
    }

    // Get or Create Session ID
    let sessionId = sessionStorage.getItem("analytics_session_id")
    let isNewSession = false
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionStorage.setItem("analytics_session_id", sessionId)
      isNewSession = true
    }

    const sendEvent = (eventType: string, metadata: Record<string, unknown> = {}) => {
      // Re-verify consent just in case it changed mid-session
      if (localStorage.getItem("cookie_consent") !== "accepted") return

      const payload = {
        visitorId,
        sessionId,
        eventType,
        pathname,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        metadata: {
          ...metadata,
          // Add viewport/device info safely
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          userAgent: navigator.userAgent
        }
      }

      // Use keepalive for reliable delivery even during navigation
      fetch("/api/analytics/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(err => {
        // Safe error handling - do not crash public site
        console.warn("Analytics event failed", err)
      })
    }

    if (isNewSession) {
      sendEvent("session_start")
    }

    // Page View Tracking
    if (pathname && !trackedPages.current.has(pathname)) {
      sendEvent("page_view")
      trackedPages.current.add(pathname)
    }

    // Interactive Element Tracking Setup
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const analyticsEl = target.closest("[data-analytics-event]") as HTMLElement

      if (analyticsEl) {
        const eventName = analyticsEl.getAttribute("data-analytics-event")
        if (eventName) {
          sendEvent(eventName, {
            text: analyticsEl.textContent?.slice(0, 50),
            id: analyticsEl.id
          })
        }
      } else {
        // Track general outbound links
        const linkEl = target.closest("a")
        if (linkEl && linkEl.href && !linkEl.href.includes(window.location.host)) {
           sendEvent("outbound_link", { href: linkEl.href })
        }
      }
    }

    // Form tracking setup
    const handleSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement
      // Ensure we don't log passwords or sensitive forms
      if (form.querySelector('input[type="password"]')) return

      const formId = form.id || form.getAttribute('name') || "unknown_form"
      sendEvent("form_start", { formId })
    }

    document.addEventListener("click", handleClick, { capture: true })
    document.addEventListener("submit", handleSubmit, { capture: true })

    // Listen to custom consent events directly to immediately start/stop tracking without refresh
    const onConsentChanged = () => {
      const newConsent = localStorage.getItem("cookie_consent")
      if (newConsent === "accepted") {
        // Immediately trigger a page view if they just accepted
        trackedPages.current.clear() // Force re-track
        window.dispatchEvent(new Event("pushstate")) // Hacky way to re-trigger the effect, or just let next navigation handle it
      } else {
        localStorage.removeItem("analytics_visitor_id")
        sessionStorage.removeItem("analytics_session_id")
      }
    }

    window.addEventListener("cookie_consent_accepted", onConsentChanged)
    window.addEventListener("cookie_consent_declined", onConsentChanged)

    return () => {
      document.removeEventListener("click", handleClick, { capture: true })
      document.removeEventListener("submit", handleSubmit, { capture: true })
      window.removeEventListener("cookie_consent_accepted", onConsentChanged)
      window.removeEventListener("cookie_consent_declined", onConsentChanged)
    }

  }, [pathname])

  return null
}
