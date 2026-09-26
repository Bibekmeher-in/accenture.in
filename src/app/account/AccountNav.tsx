"use client"

import React, { useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { User, ShoppingBag, MapPin, Shield, LogOut } from "lucide-react"
import { logoutCustomer } from "@/app/actions/customer-auth"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/account", label: "Profile", icon: User, exact: true },
  { href: "/account/orders", label: "Orders", icon: ShoppingBag },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/security", label: "Security", icon: Shield },
]

export function AccountNav({
  customerName,
  customerEmail,
}: {
  customerName: string
  customerEmail: string
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, startLogout] = useTransition()

  const handleLogout = () => {
    startLogout(async () => {
      await logoutCustomer()
      router.push("/home")
      router.refresh()
    })
  }

  const normalizedPath = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname

  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-3.5 pb-6 border-b border-border">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary font-black text-lg flex items-center justify-center shrink-0">
          {customerName ? customerName.charAt(0).toUpperCase() : "U"}
        </div>
        <div className="overflow-hidden">
          <p className="font-bold text-sm truncate text-foreground">{customerName || "Customer"}</p>
          <p className="text-xs text-muted-foreground truncate">{customerEmail}</p>
        </div>
      </div>

      <nav className="space-y-1.5">
        {navLinks.map((item) => {
          const isActive = item.exact
            ? normalizedPath === item.href
            : normalizedPath.startsWith(item.href)
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="pt-4 border-t border-border">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
        </button>
      </div>
    </div>
  )
}
