import * as React from "react"
import Link from "next/link"
import { Container } from "@/components/ui/Container"
import { Section } from "@/components/ui/Section"
import { buttonStyles } from "@/components/ui/Button"

interface CTASectionProps {
  heading?: string
  description?: string
  badge?: string
  primaryAction?: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    href: string
  }
  className?: string
}

export function CTASection({
  heading = "Ready to discuss your project?",
  description = "Let's talk about your business requirements and explore how we can help.",
  badge,
  primaryAction = {
    label: "Start a Project",
    href: "/contact/",
  },
  secondaryAction,
  className = "",
}: CTASectionProps) {
  return (
    <Section className={`bg-primary text-primary-foreground border-y border-border ${className}`}>
      <Container>
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          {badge && (
            <span className="inline-block px-3 py-1 text-xs font-black tracking-widest uppercase rounded-full bg-primary-foreground/20 text-primary-foreground mb-4">
              {badge}
            </span>
          )}
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
            {heading}
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            {primaryAction?.label && (
              <Link
                href={primaryAction.href}
                className={buttonStyles({ size: "lg", variant: "secondary", className: "w-full sm:w-auto font-bold" })}
              >
                {primaryAction.label}
              </Link>
            )}
            {secondaryAction?.label && (
              <Link
                href={secondaryAction.href}
                className={buttonStyles({
                  size: "lg",
                  variant: "outline",
                  className:
                    "w-full sm:w-auto border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary font-bold",
                })}
              >
                {secondaryAction.label}
              </Link>
            )}
          </div>
        </div>
      </Container>
    </Section>
  )
}
