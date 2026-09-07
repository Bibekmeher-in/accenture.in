import { Metadata } from "next"
import { notFound } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { Container } from "@/components/ui/Container"
import { Section } from "@/components/ui/Section"
import { CTASection } from "@/components/blocks/CTASection"
import { getServiceBySlug } from "@/data/services"

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const service = getServiceBySlug(slug)

  if (!service) {
    return {
      title: "Service Not Found | TEKNIXX",
    }
  }

  return {
    title: `${service.title} | Services | TEKNIXX`,
    description: service.description,
  }
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { slug } = await params
  const service = getServiceBySlug(slug)

  if (!service) {
    notFound()
  }

  const Icon = service.icon

  return (
    <>
      <Section className="pt-24 pb-16 md:pt-32 md:pb-24 bg-background border-b border-border">
        <Container>
          <div className="max-w-4xl">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-8">
              <Icon className="h-8 w-8" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
              {service.title}
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl leading-relaxed">
              {service.introduction}
            </p>
          </div>
        </Container>
      </Section>

      <Section className="bg-muted/50">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
            <div className="bg-background rounded-2xl p-8 border border-border shadow-sm">
              <h2 className="text-2xl font-bold mb-6">What this covers</h2>
              <ul className="space-y-4">
                {service.covers.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle2 className="h-6 w-6 text-primary mr-3 flex-shrink-0" />
                    <span className="text-foreground text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-background rounded-2xl p-8 border border-border shadow-sm">
              <h2 className="text-2xl font-bold mb-6">Key Benefits</h2>
              <ul className="space-y-4">
                {service.benefits.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle2 className="h-6 w-6 text-primary mr-3 flex-shrink-0" />
                    <span className="text-foreground text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </Section>

      <CTASection
        heading={`Ready to start your ${service.title.toLowerCase()} project?`}
        description="Contact us to discuss your requirements and see how our expertise aligns with your goals."
        primaryAction={{
          label: "Start a Project",
          href: "/contact/",
        }}
        secondaryAction={{
          label: "View All Services",
          href: "/services/",
        }}
      />
    </>
  )
}
