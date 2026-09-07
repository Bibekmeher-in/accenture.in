"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  FileText,
  FolderGit2,
  LogOut,
  Menu,
  Shield,
  Cookie,
  LineChart,
  LayoutTemplate,
  BookOpen,
  Store,
  Settings
} from "lucide-react"

const ALL_NAVIGATION = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, role: "admin" },
  { name: "Leads", href: "/admin/leads", icon: Users, role: "admin" },
  { name: "Services", href: "/admin/services", icon: LayoutTemplate, role: "admin" },
  { name: "Portfolio", href: "/admin/portfolio", icon: FolderGit2, role: "admin" },
  { name: "Blog", href: "/admin/blog", icon: FileText, role: "admin" },
  { name: "Analytics", href: "/admin/analytics", icon: LineChart, role: "super_admin" },
  { name: "Cookies", href: "/admin/cookies", icon: Cookie, role: "super_admin" },
  { name: "Learning", href: "/admin/learning", icon: BookOpen, role: "admin" },
  { name: "Store", href: "/admin/store", icon: Store, role: "admin" },
  { name: "Users", href: "/admin/users", icon: Shield, role: "super_admin" },
  { name: "Audit Logs", href: "/admin/audit-logs", icon: FileText, role: "super_admin" },
  { name: "Settings", href: "/admin/settings", icon: Settings, role: "admin" },
]

import { AdminNotificationsListener } from "@/components/admin/AdminNotificationsListener"

export default function ClientLayout({ children, role }: { children: React.ReactNode, role: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  // Escape key handler to close the drawer
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false)
    }
    if (sidebarOpen) {
      document.addEventListener("keydown", handleEscape)
      // Prevent background scrolling on mobile when open
      if (window.innerWidth < 768) {
        document.body.style.overflow = "hidden"
      }
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [sidebarOpen])

  // Don't wrap the login page in the dashboard layout
  const normalizedPath = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname
  if (normalizedPath === "/admin/login") {
    return <>{children}</>
  }

  const handleLogout = async () => {
    // We need a quick API route for logout to clear the cookie
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row">
      <AdminNotificationsListener />
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between bg-card border-b border-border p-4 z-40">
        <span className="text-lg font-bold">Admin Portal</span>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-foreground"
          aria-expanded={sidebarOpen}
          aria-controls="admin-sidebar"
          aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        id="admin-sidebar"
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out
          md:relative md:translate-x-0 flex-shrink-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center justify-between px-6 border-b border-border">
            <span className="text-xl font-bold tracking-tight">TEKNIXX</span>
            <button
              className="md:hidden p-2 -mr-2 text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <LogOut className="h-5 w-5 rotate-180" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {ALL_NAVIGATION.filter(item => role === "super_admin" || item.role === "admin").map((item) => {
              const isActive = pathname.startsWith(item.href)
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group flex items-center px-3 py-2 text-sm font-medium rounded-md
                    ${isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }
                  `}
                >
                  <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <button
              onClick={handleLogout}
              className="group flex w-full items-center px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-muted-foreground group-hover:text-foreground" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        <main className="py-6 px-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
