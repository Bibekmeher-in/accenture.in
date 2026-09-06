import * as React from "react"
import Link from "next/link"
import { Container } from "@/components/ui/Container"
import { Section } from "@/components/ui/Section"
import { buttonStyles } from "@/components/ui/Button"

interface CTASectionProps {
  heading: string
  description: string
  primaryAction: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    href: string
  }
}

export function CTASection({
  heading,
  description,
  primaryAction,
  secondaryAction,
}: CTASectionProps) {
  return (
    <Section className="bg-primary text-primary-foreground border-y border-border">
      <Container>
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
            {heading}
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl">
            {description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              href={primaryAction.href}
              className={buttonStyles({ size: "lg", variant: "secondary", className: "w-full sm:w-auto" })}
            >
              {primaryAction.label}
            </Link>
            {secondaryAction && (
              <Link
                href={secondaryAction.href}
                className={buttonStyles({ size: "lg", variant: "outline", className: "w-full sm:w-auto border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" })}
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
