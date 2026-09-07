"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
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
            <Link href="/home/" className="flex items-center space-x-3 transition-opacity hover:opacity-90">
              <Image src="/logo.png" alt="TEKNIXX" width={40} height={40} className="object-contain" />
              <span className="inline-block font-extrabold text-xl tracking-[0.2em] uppercase bg-gradient-to-r from-zinc-900 to-zinc-500 bg-clip-text text-transparent drop-shadow-sm">
                TEKNIXX
              </span>
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
