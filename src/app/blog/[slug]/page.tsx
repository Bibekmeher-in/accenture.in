import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Calendar } from "lucide-react"
import { Container } from "@/components/ui/Container"
import { Section } from "@/components/ui/Section"
import { CTASection } from "@/components/blocks/CTASection"
import { getBlogPostBySlug } from "@/data/blog"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    return {
      title: "Article Not Found | TEKNIXX",
    }
  }

  return {
    title: `${post.title} | Blog | TEKNIXX`,
    description: post.excerpt,
  }
}

import sanitizeHtml from "sanitize-html"

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  if (!post) {
    notFound()
  }

  // Format date safely
  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const cleanHtml = sanitizeHtml(post.content, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([ 'img', 'h1', 'h2', 'h3' ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      'img': ['src', 'alt'],
      '*': ['class', 'id']
    }
  })

  return (
    <>
      <Section className="pt-24 pb-12 md:pt-32 md:pb-16 bg-background border-b border-border">
        <Container>
          <div className="max-w-3xl mx-auto">
            <Link
              href="/blog/"
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>

            <div className="flex items-center gap-4 mb-6 text-sm">
              <span className="font-semibold text-primary">{post.category}</span>
              <span className="text-muted-foreground">•</span>
              <span className="flex items-center text-muted-foreground">
                <Calendar className="mr-2 h-4 w-4" />
                {formattedDate}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-muted text-muted-foreground">
                {post.type}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
              {post.title}
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>
          </div>
        </Container>
      </Section>

      <Section className="bg-background">
        <Container>
          <div className="max-w-3xl mx-auto">
            <div
              className="prose prose-lg dark:prose-invert prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline max-w-none"
              dangerouslySetInnerHTML={{ __html: cleanHtml }}
            />
          </div>
        </Container>
      </Section>

      <CTASection
        heading="Enjoyed this article?"
        description="We regularly publish insights on software engineering and digital strategy. Reach out if you'd like to discuss these concepts in the context of your business."
        primaryAction={{
          label: "Contact Us",
          href: "/contact/",
        }}
        secondaryAction={{
          label: "View Services",
          href: "/services/",
        }}
      />
    </>
  )
}
