"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function AdminNotificationsListener() {
  const router = useRouter()

  useEffect(() => {
    let eventSource: EventSource | null = null

    const connectSSE = () => {
      eventSource = new EventSource("/api/admin/notifications/live")

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)

          if (data.type === "NEW_LEAD") {
            // Check if sonner is available globally or we just use native Notification API
            // For now, let's inject a custom styled toast or use native if we don't have a library
            if (typeof window !== "undefined" && "Notification" in window) {
              if (Notification.permission === "granted") {
                new Notification(data.message, { body: `Lead: ${data.leadName}` })
              } else if (Notification.permission !== "denied") {
                Notification.requestPermission()
              }
            }

            // Also show a simple in-app alert/toast if we have a generic wrapper.
            // Since we don't know the exact toast library installed, we can create a simple DOM element
            // or just rely on a standard alert/console if necessary. But creating a floating div is safer.
            showToast(data.message, `From: ${data.leadName}`, () => {
              router.push("/admin/leads")
            })
          }
        } catch (e) {
          console.error("Failed to parse notification", e)
        }
      }

      eventSource.onerror = () => {
        // Silently reconnect
      }
    }

    connectSSE()

    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [router])

  return null
}

// Simple fallback toast implementation so we don't depend on external missing libs
function showToast(title: string, message: string, onClick: () => void) {
  const container = document.getElementById("admin-toast-container") || createToastContainer()

  const toast = document.createElement("div")
  toast.className = "bg-primary text-primary-foreground p-4 rounded-lg shadow-xl mb-3 cursor-pointer transform transition-all duration-300 translate-x-full opacity-0 flex flex-col gap-1"
  toast.innerHTML = `
    <div class="font-bold text-sm">${title}</div>
    <div class="text-xs opacity-90">${message}</div>
  `

  toast.onclick = () => {
    onClick()
    toast.remove()
  }

  container.appendChild(toast)

  // Animate in
  setTimeout(() => {
    toast.classList.remove("translate-x-full", "opacity-0")
  }, 10)

  // Auto remove after 5s
  setTimeout(() => {
    toast.classList.add("opacity-0")
    setTimeout(() => toast.remove(), 300)
  }, 5000)
}

function createToastContainer() {
  const container = document.createElement("div")
  container.id = "admin-toast-container"
  container.className = "fixed bottom-4 right-4 z-[100] flex flex-col items-end pointer-events-auto"
  document.body.appendChild(container)
  return container
}
