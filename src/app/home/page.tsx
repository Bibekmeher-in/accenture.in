import { Metadata } from "next"
import Link from "next/link"
import { Code, Layout, Server, ArrowRight } from "lucide-react"

import { Container } from "@/components/ui/Container"
import { Section } from "@/components/ui/Section"
import { SectionHeading } from "@/components/ui/SectionHeading"
import { buttonStyles } from "@/components/ui/Button"
import { ServiceCard } from "@/components/blocks/ServiceCard"
import { ProjectCard } from "@/components/blocks/ProjectCard"
import { BlogCard } from "@/components/blocks/BlogCard"
import { CTASection } from "@/components/blocks/CTASection"

export const metadata: Metadata = {
  title: "TEKNIXX | Professional IT Services & Solutions",
  description: "We help businesses design, build, improve, and maintain modern digital solutions.",
}

const services = [
  {
    title: "Web Development",
    description: "Responsive, high-performance web applications built with modern frameworks and best practices.",
    href: "/services/web-development/",
    icon: Code,
  },
  {
    title: "UI/UX Design",
    description: "User-centric interface design focusing on clarity, accessibility, and professional aesthetics.",
    href: "/services/ui-ux-design/",
    icon: Layout,
  },
  {
    title: "Software Solutions",
    description: "Custom software development addressing specific business requirements and workflows.",
    href: "/services/software-development/",
    icon: Server,
  },
]

const processSteps = [
  {
    number: "01",
    title: "Discover",
    description: "Understand requirements, goals, users, and constraints.",
  },
  {
    number: "02",
    title: "Plan",
    description: "Define scope, architecture, priorities, and implementation approach.",
  },
  {
    number: "03",
    title: "Build",
    description: "Design and develop the agreed solution.",
  },
  {
    number: "04",
    title: "Improve",
    description: "Test, refine, launch, and support the solution.",
  },
]

const recentProjects = [
  {
    title: "Global Supply Chain Dashboard",
    description: "A real-time logistics visualization platform resolving supply chain bottlenecks for a Fortune 500 retailer.",
    href: "/portfolio/",
    tags: ["React", "Node.js", "WebSockets", "D3.js"],
  },
  {
    title: "Fintech Mobile Application",
    description: "A secure, cross-platform mobile app enabling seamless international transfers with multi-currency wallets.",
    href: "/portfolio/",
    tags: ["React Native", "TypeScript", "PostgreSQL", "AWS"],
  },
]

const recentPosts = [
  {
    title: "Modern Web Architecture Principles",
    excerpt: "An overview of reliable, scalable architectural patterns for modern web applications.",
    href: "/blog/",
    date: new Date().toISOString(),
    category: "Architecture",
  },
  {
    title: "Improving Web Accessibility",
    excerpt: "Practical approaches to ensuring digital products are usable by everyone.",
    href: "/blog/",
    date: new Date().toISOString(),
    category: "Design",
  },
]

export default function HomePage() {
  return (
    <>
      {/* 1. Hero Section */}
      <Section className="pt-24 pb-16 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32 bg-background overflow-hidden border-b border-border">
        <Container>
          <div className="max-w-4xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
              We Build Digital Solutions That Help Businesses Grow.
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground mb-10 max-w-2xl leading-relaxed">
              We help businesses design, build, improve, and maintain modern digital solutions with a focus on reliability and performance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contact/"
                className={buttonStyles({ size: "lg", variant: "default" })}
              >
                Start a Project
              </Link>
              <Link
                href="/services/"
                className={buttonStyles({ size: "lg", variant: "outline" })}
              >
                View Services
              </Link>
            </div>
          </div>
        </Container>
      </Section>

      {/* 2. Services Overview */}
      <Section className="bg-muted/50">
        <Container>
          <SectionHeading
            title="Our Capabilities"
            subtitle="Professional services tailored to your specific technical and business requirements."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <ServiceCard key={index} {...service} />
            ))}
          </div>
        </Container>
      </Section>

      {/* 3. About / Value Proposition */}
      <Section>
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-6">
                A Practical Approach to Digital Excellence
              </h2>
              <div className="space-y-4 text-lg text-muted-foreground mb-8">
                <p>
                  We focus on understanding business requirements, making practical technology choices, and maintaining clear communication throughout the project lifecycle.
                </p>
                <p>
                  Our goal is to deliver maintainable solutions and user-focused designs that provide long-term reliability for your organization.
                </p>
              </div>
              <Link
                href="/about/"
                className="inline-flex items-center text-primary font-medium hover:underline"
              >
                More about our approach <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <div className="bg-muted rounded-2xl p-8 lg:p-12 border border-border">
              <ul className="space-y-6">
                {[
                  "Understanding business requirements",
                  "Practical technology choices",
                  "Clear communication",
                  "Maintainable solutions",
                ].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <div className="mr-4 mt-1 h-2 w-2 rounded-full bg-primary" />
                    <span className="text-foreground font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* 4. Process */}
      <Section className="bg-foreground text-background">
        <Container>
          <SectionHeading
            title="How We Work"
            subtitle="A structured, transparent methodology ensuring alignment from conception to deployment."
            className="[&_h2]:text-background [&_p]:text-muted"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step) => (
              <div key={step.number} className="relative">
                <div className="text-4xl font-black text-muted-foreground/30 mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* 5. Selected Work */}
      <Section className="bg-muted/50">
        <Container>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <SectionHeading
              title="Selected Work"
              subtitle="A preview of our recent projects and technical implementations."
              className="mb-0"
            />
            <Link
              href="/portfolio/"
              className={buttonStyles({ variant: "outline" })}
            >
              View Portfolio
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {recentProjects.map((project, index) => (
              <ProjectCard key={index} {...project} />
            ))}
          </div>
        </Container>
      </Section>

      {/* 6. Blog / Insights Preview */}
      <Section>
        <Container>
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <SectionHeading
              title="Latest Insights"
              subtitle="Perspectives on technology, design, and digital strategy."
              className="mb-0"
            />
            <Link
              href="/blog/"
              className={buttonStyles({ variant: "outline" })}
            >
              View All Insights
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {recentPosts.map((post, index) => (
              <BlogCard key={index} {...post} />
            ))}
          </div>
        </Container>
      </Section>

      {/* 7. Final CTA */}
      <CTASection
        heading="Have a project in mind?"
        description="Let's discuss what you need and determine the right approach."
        primaryAction={{
          label: "Start a Project",
          href: "/contact/",
        }}
        secondaryAction={{
          label: "View Our Services",
          href: "/services/",
        }}
      />
    </>
  )
}
