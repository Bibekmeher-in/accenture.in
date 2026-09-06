import { Metadata } from "next"
import {
  Lightbulb,
  Target,
  Wrench,
  TrendingUp,
  CheckCircle2,
  Shield,
  Zap,
  Users
} from "lucide-react"

import { Container } from "@/components/ui/Container"
import { Section } from "@/components/ui/Section"
import { SectionHeading } from "@/components/ui/SectionHeading"
import { CTASection } from "@/components/blocks/CTASection"

export const metadata: Metadata = {
  title: "About Us | Accenture.in",
  description: "Learn about our approach to building maintainable, scalable, and user-focused digital solutions.",
}

const approaches = [
  {
    title: "Understand",
    description: "We start by deeply understanding the business problem, users, operational requirements, and constraints before writing a single line of code.",
    icon: Lightbulb,
  },
  {
    title: "Design",
    description: "We create clear, functional user experiences and establish a solid technical architecture tailored to the specific needs of the project.",
    icon: Target,
  },
  {
    title: "Build",
    description: "We develop solutions using appropriate, reliable technologies and engineering practices that ensure long-term maintainability.",
    icon: Wrench,
  },
  {
    title: "Improve",
    description: "We systematically test, refine, launch, and maintain the solution, ensuring it evolves alongside your business requirements.",
    icon: TrendingUp,
  },
]

const principles = [
  { title: "Clarity", description: "Clear communication, transparent processes, and code that is easy to understand and maintain." },
  { title: "Practicality", description: "Choosing the right tool for the job rather than chasing the latest engineering trends." },
  { title: "Quality", description: "A commitment to high standards in both user experience and technical implementation." },
  { title: "Reliability", description: "Building systems that operate predictably and securely under real-world conditions." },
  { title: "User Focus", description: "Ensuring every technical decision ultimately serves the people using the product." },
  { title: "Continuous Improvement", description: "Iteratively refining our processes, skills, and the solutions we deliver." },
]

export default function AboutPage() {
  return (
    <>
      {/* 1. About Hero */}
      <Section className="pt-24 pb-16 md:pt-32 md:pb-24 lg:pt-40 lg:pb-32 bg-background border-b border-border">
        <Container>
          <div className="max-w-4xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
              Building Digital Solutions That Work.
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl leading-relaxed">
              We are a technology services company dedicated to translating complex business requirements into clear, practical, and reliable digital products.
            </p>
          </div>
        </Container>
      </Section>

      {/* 2. Who We Are */}
      <Section className="bg-muted/50">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <SectionHeading
                title="Who We Are"
                subtitle="Bridging the gap between business objectives and engineering execution."
                className="mb-6"
              />
              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  At Accenture.in, we focus on understanding your core business requirements and translating them into practical, high-performance digital solutions.
                </p>
                <p>
                  We believe that the best digital products come from combining thoughtful design with disciplined engineering. By prioritizing usability and reliability over unnecessary complexity, we build systems that are not only effective today but remain maintainable for years to come.
                </p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-bold mb-6">Our Core Focus</h3>
              <ul className="space-y-4">
                {[
                  "Understanding core business requirements",
                  "Translating requirements into practical solutions",
                  "Combining design and engineering",
                  "Building maintainable systems",
                  "Prioritizing usability and reliability",
                ].map((item, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle2 className="h-6 w-6 text-primary mr-3 flex-shrink-0" />
                    <span className="text-foreground font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      {/* 3. Approach */}
      <Section>
        <Container>
          <SectionHeading
            title="Our Approach"
            subtitle="A structured methodology focused on delivering consistent, high-quality outcomes."
            alignment="center"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
            {approaches.map((approach, index) => {
              const Icon = approach.icon
              return (
                <div key={index} className="flex flex-col items-center text-center p-6 rounded-2xl border border-border bg-card transition-all hover:border-primary/20 hover:shadow-sm">
                  <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{approach.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {approach.description}
                  </p>
                </div>
              )
            })}
          </div>
        </Container>
      </Section>

      {/* 4. Principles */}
      <Section className="bg-foreground text-background">
        <Container>
          <SectionHeading
            title="Guiding Principles"
            subtitle="The core values that drive our engineering, design, and communication."
            className="[&_h2]:text-background [&_p]:text-muted"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 mt-12">
            {principles.map((principle, index) => (
              <div key={index}>
                <h3 className="text-xl font-bold mb-3 text-background flex items-center">
                  <span className="w-8 h-px bg-primary mr-4"></span>
                  {principle.title}
                </h3>
                <p className="text-muted leading-relaxed">
                  {principle.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* 5. Technology Philosophy */}
      <Section className="bg-muted/50 border-b border-border">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <SectionHeading
              title="Technology Philosophy"
              subtitle="We view technology as a tool to solve problems, not an end in itself. Our engineering decisions are driven by strict foundational criteria."
              alignment="center"
              className="mb-12"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { title: "Business Requirements", icon: Target },
              { title: "Maintainability", icon: Wrench },
              { title: "Performance", icon: Zap },
              { title: "Security", icon: Shield },
              { title: "Scalability", icon: TrendingUp },
              { title: "User Experience", icon: Users },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="flex items-center p-4 bg-background border border-border rounded-lg shadow-sm">
                  <Icon className="h-5 w-5 text-primary mr-4 flex-shrink-0" />
                  <span className="font-semibold text-foreground">{item.title}</span>
                </div>
              )
            })}
          </div>
        </Container>
      </Section>

      {/* 6. CTA */}
      <CTASection
        heading="Ready to discuss your project?"
        description="Let's talk about your business requirements and explore how we can help."
        primaryAction={{
          label: "Start a Project",
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
