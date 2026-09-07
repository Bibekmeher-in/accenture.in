import { Metadata } from "next"
import { Container } from "@/components/ui/Container"
import { Section } from "@/components/ui/Section"
import { BlogCard } from "@/components/blocks/BlogCard"
import { CTASection } from "@/components/blocks/CTASection"
import { getBlogPosts } from "@/data/blog"

export const metadata: Metadata = {
  title: "Blog & Insights | TEKNIXX",
  description: "Perspectives on software engineering, digital design, and technology architecture.",
}

export default async function BlogPage() {
  const blogPosts = await getBlogPosts()

  return (
    <>
      <Section className="pt-24 pb-16 md:pt-32 md:pb-24 bg-background border-b border-border">
        <Container>
          <div className="max-w-4xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
              Insights & Perspectives.
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl leading-relaxed">
              Our thoughts on modern software engineering, sustainable architecture, and digital strategy.
            </p>
          </div>
        </Container>
      </Section>

      <Section className="bg-muted/50">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {blogPosts.map((post, index) => (
              <div key={index} className="flex flex-col relative h-full">
                <div className="absolute top-6 right-6 z-10">
                  <span className="inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-background/80 backdrop-blur-sm border border-border text-muted-foreground">
                    {post.type}
                  </span>
                </div>
                <BlogCard
                  title={post.title}
                  excerpt={post.excerpt}
                  href={`/blog/${post.slug}/`}
                  date={post.date}
                  category={post.category}
                />
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <CTASection
        heading="Looking for technical expertise?"
        description="Our team translates complex technical concepts into reliable business solutions."
        primaryAction={{
          label: "Contact Us",
          href: "/contact/",
        }}
      />
    </>
  )
}
