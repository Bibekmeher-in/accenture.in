import * as React from "react"
import Link from "next/link"
import { Container } from "@/components/ui/Container"

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <Container>
        <div className="py-12 md:py-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4 tracking-tight">TEKNIXX</h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              We build digital solutions that help businesses grow.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">Services</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/services/web-development/" className="hover:text-primary transition-colors">Web Development</Link></li>
              <li><Link href="/services/ui-ux-design/" className="hover:text-primary transition-colors">UI/UX Design</Link></li>
              <li><Link href="/services/software-development/" className="hover:text-primary transition-colors">Software Development</Link></li>
              <li><Link href="/services/seo/" className="hover:text-primary transition-colors">SEO</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about/" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/portfolio/" className="hover:text-primary transition-colors">Portfolio</Link></li>
              <li><Link href="/blog/" className="hover:text-primary transition-colors">Blog</Link></li>
              <li><Link href="/contact/" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-sm">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy-policy/" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-and-conditions/" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/cookie-policy/" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="py-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} TEKNIXX. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  )
}
