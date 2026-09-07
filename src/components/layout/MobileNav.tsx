"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { 
  Menu, 
  X, 
  Home, 
  Info, 
  Layers, 
  ShoppingBag, 
  GraduationCap, 
  Briefcase, 
  FileText, 
  ArrowRight,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/Button"
import { useCart } from "@/components/store/CartProvider"

const navItems = [
  { href: "/home/", label: "Home", icon: Home, description: "Overview & digital solutions" },
  { href: "/about/", label: "About", icon: Info, description: "Our approach & culture" },
  { href: "/services/", label: "Services", icon: Layers, description: "End-to-end technical capabilities" },
  { href: "/store/", label: "Store", icon: ShoppingBag, description: "Products & merchandise" },
  { href: "/learning/", label: "Learning", icon: GraduationCap, description: "Courses & professional skills" },
  { href: "/portfolio/", label: "Portfolio", icon: Briefcase, description: "Selected client case studies" },
  { href: "/blog/", label: "Blog", icon: FileText, description: "Tech insights & engineering" },
]

function isRouteActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  const normalizedPath = pathname.replace(/\/$/, "");
  const normalizedHref = href.replace(/\/$/, "");

  if (normalizedPath === normalizedHref) return true;
  return normalizedPath.startsWith(`${normalizedHref}/`);
}

export function MobileNav() {
  const [isOpen, setIsOpen] = React.useState(false)
  const pathname = usePathname()
  const { totalItems, setIsCartOpen } = useCart()

  // Hydration-safe mounting check without triggering set-state-in-effect
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  // Auto-close on route change during render (React recommended pattern)
  const [prevPathname, setPrevPathname] = React.useState(pathname)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setIsOpen(false)
  }

  // Handle escape key and lock body scroll
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      const scrollY = window.scrollY
      document.body.style.position = "fixed"
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = "100%"
      document.body.style.overflowY = "scroll"
    } else {
      const scrollY = document.body.style.top
      document.body.style.position = ""
      document.body.style.top = ""
      document.body.style.width = ""
      document.body.style.overflowY = ""
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1)
      }
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
      const scrollY = document.body.style.top
      document.body.style.position = ""
      document.body.style.top = ""
      document.body.style.width = ""
      document.body.style.overflowY = ""
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1)
      }
    }
  }, [isOpen])

  const handleCartClick = () => {
    setIsOpen(false)
    setIsCartOpen(true)
  }

  const drawerContent = (
    <div
      className={cn(
        "fixed inset-0 z-[100] md:hidden transition-all duration-300",
        isOpen ? "visible pointer-events-auto" : "invisible pointer-events-none"
      )}
      aria-hidden={!isOpen}
    >
      {/* Dimmed backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Slide-over panel */}
      <div
        id="mobile-menu"
        className={cn(
          "absolute top-0 right-0 bottom-0 w-[86vw] max-w-[340px] bg-background border-l border-border shadow-2xl flex flex-col justify-between overflow-hidden transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-border bg-muted/20 shrink-0">
          <Link 
            href="/home/" 
            onClick={() => setIsOpen(false)}
            className="flex items-center space-x-2.5"
          >
            <Image src="/logo.png" alt="TEKNIXX" width={32} height={32} className="object-contain" />
            <span className="font-extrabold text-base tracking-[0.18em] uppercase bg-gradient-to-r from-zinc-900 to-zinc-500 bg-clip-text text-transparent">
              TEKNIXX
            </span>
          </Link>

          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 overscroll-contain">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isRouteActive(pathname, item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all group",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground/80 hover:text-foreground hover:bg-muted"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    active ? "bg-primary-foreground/15 text-primary-foreground" : "bg-muted text-foreground/70 group-hover:text-primary group-hover:bg-primary/10"
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span>{item.label}</span>
                </div>
                <ChevronRight className={cn(
                  "h-4 w-4 transition-transform group-hover:translate-x-0.5",
                  active ? "text-primary-foreground/70" : "text-muted-foreground/40"
                )} />
              </Link>
            )
          })}

          {/* Cart Quick Access */}
          <button
            onClick={handleCartClick}
            className="w-full mt-2 flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <span className="font-semibold">Shopping Cart</span>
            </div>
            {totalItems > 0 ? (
              <span className="px-2 py-0.5 text-xs font-bold bg-primary text-primary-foreground rounded-full">
                {totalItems} item{totalItems > 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Empty</span>
            )}
          </button>
        </div>

        {/* Drawer Bottom Actions & Contacts */}
        <div className="p-4 border-t border-border bg-muted/10 shrink-0 space-y-3">
          <Link 
            href="/contact/" 
            onClick={() => setIsOpen(false)} 
            className="block w-full"
          >
            <Button className="w-full justify-center gap-2 font-bold shadow-md" size="lg">
              <span>Contact Us</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>

          <div className="pt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link href="/privacy-policy/" onClick={() => setIsOpen(false)} className="hover:underline">
              Privacy
            </Link>
            <span>•</span>
            <Link href="/terms-and-conditions/" onClick={() => setIsOpen(false)} className="hover:underline">
              Terms
            </Link>
            <span>•</span>
            <Link href="/cookie-policy/" onClick={() => setIsOpen(false)} className="hover:underline">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 sm:p-2.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mounted && createPortal(drawerContent, document.body)}
    </div>
  )
}
