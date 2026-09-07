"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"
import { Container } from "@/components/ui/Container"
import { Button } from "@/components/ui/Button"
import { MobileNav } from "@/components/layout/MobileNav"
import { useCart } from "@/components/store/CartProvider"

const navItems = [
  { href: "/home/", label: "Home" },
  { href: "/about/", label: "About" },
  { href: "/services/", label: "Services" },
  { href: "/store/", label: "Store" },
  { href: "/learning/", label: "Learning" },
  { href: "/portfolio/", label: "Portfolio" },
  { href: "/blog/", label: "Blog" },
]

function isRouteActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  const normalizedPath = pathname.replace(/\/$/, "");
  const normalizedHref = href.replace(/\/$/, "");

  if (normalizedPath === normalizedHref) return true;
  return normalizedPath.startsWith(`${normalizedHref}/`);
}

export function Navbar() {
  const pathname = usePathname()
  const { totalItems, setIsCartOpen } = useCart()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Container>
        <div className="flex h-16 items-center justify-between gap-2">
          {/* Logo & Brand */}
          <Link href="/home/" className="flex items-center space-x-2.5 sm:space-x-3 shrink-0 transition-opacity hover:opacity-90">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center">
              <Image src="/logo.png" alt="TEKNIXX" width={36} height={36} className="object-contain" priority />
            </div>
            <span className="font-extrabold text-lg sm:text-xl tracking-[0.18em] sm:tracking-[0.2em] uppercase bg-gradient-to-r from-zinc-900 to-zinc-500 bg-clip-text text-transparent drop-shadow-sm">
              TEKNIXX
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-7">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary py-1 relative",
                  isRouteActive(pathname, item.href)
                    ? "text-primary font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Actions & Mobile Trigger */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Cart Trigger Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 sm:p-2.5 rounded-full hover:bg-muted text-foreground transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`Shopping cart with ${totalItems} items`}
            >
              <ShoppingBag className="w-5 h-5 text-foreground" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-in zoom-in-75">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>

            {/* Desktop Contact CTA */}
            <div className="hidden md:block">
              <Link href="/contact/">
                <Button size="sm" className="font-semibold">Contact Us</Button>
              </Link>
            </div>

            {/* Mobile Hamburger Trigger */}
            <MobileNav />
          </div>
        </div>
      </Container>
    </header>
  )
}
