import * as React from "react"
import Link from "next/link"
import { ArrowRight, type LucideIcon } from "lucide-react"

interface ServiceCardProps {
  title: string
  description: string
  href: string
  icon?: LucideIcon
}

export function ServiceCard({ title, description, href, icon: Icon }: ServiceCardProps) {
  return (
    <div className="group relative flex flex-col justify-between p-6 bg-card border border-border rounded-xl transition-all hover:shadow-md hover:border-primary/20">
      <div>
        {Icon && (
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
        )}
        <h3 className="text-xl font-bold mb-3 text-foreground">{title}</h3>
        <p className="text-muted-foreground leading-relaxed mb-6">
          {description}
        </p>
      </div>
      <Link
        href={href}
        className="inline-flex items-center text-sm font-medium text-primary hover:underline"
      >
        Learn more <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
        <span className="absolute inset-0" aria-hidden="true" />
      </Link>
    </div>
  )
}
