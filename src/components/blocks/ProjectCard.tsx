import * as React from "react"
import Link from "next/link"
import Image from "next/image"

interface ProjectCardProps {
  title: string
  description: string
  href: string
  tags: string[]
  imageUrl?: string
}

export function ProjectCard({ title, description, href, tags, imageUrl }: ProjectCardProps) {
  return (
    <div className="group flex flex-col bg-card border border-border rounded-xl overflow-hidden transition-all hover:shadow-md hover:border-primary/20">
      <div className="aspect-video bg-muted relative flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="text-muted-foreground/50 font-medium">Image Placeholder</div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-colors">
          <Link href={href}>
            <span className="absolute inset-0" aria-hidden="true" />
            {title}
          </Link>
        </h3>
        <p className="text-muted-foreground text-sm flex-1 mb-4">
          {description}
        </p>
        <div className="flex flex-wrap gap-2 mt-auto">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
