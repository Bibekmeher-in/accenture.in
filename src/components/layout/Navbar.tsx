"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Container } from "@/components/ui/Container"
import { Button } from "@/components/ui/Button"
import { MobileNav } from "@/components/layout/MobileNav"

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container>
        <div className="flex h-16 items-center justify-between">
          <div className="flex gap-6 md:gap-10">
            <Link href="/home/" className="flex items-center space-x-2">
              <span className="inline-block font-bold text-xl tracking-tight">Accenture.in</span>
            </Link>
          </div>

          <nav className="hidden md:flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center text-sm font-medium transition-colors hover:text-primary",
                  isRouteActive(pathname, item.href)
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex">
            <Link href="/contact/">
              <Button>Contact Us</Button>
            </Link>
          </div>

          <MobileNav />
        </div>
      </Container>
    </header>
  )
}
