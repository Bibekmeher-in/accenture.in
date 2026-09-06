import * as React from "react"
import Link from "next/link"

interface BlogCardProps {
  title: string
  excerpt: string
  href: string
  date: string
  category: string
}

export function BlogCard({ title, excerpt, href, date, category }: BlogCardProps) {
  return (
    <article className="group flex flex-col items-start justify-between">
      <div className="flex items-center gap-x-4 text-xs mb-3">
        <time dateTime={date} className="text-muted-foreground">
          {new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </time>
        <span className="relative z-10 rounded-full bg-secondary px-3 py-1.5 font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors">
          {category}
        </span>
      </div>
      <div className="group relative">
        <h3 className="mt-3 text-xl font-bold leading-6 text-foreground group-hover:text-primary transition-colors">
          <Link href={href}>
            <span className="absolute inset-0" />
            {title}
          </Link>
        </h3>
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
          {excerpt}
        </p>
      </div>
    </article>
  )
}
