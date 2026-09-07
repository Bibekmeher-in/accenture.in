import { Metadata } from "next"
import { Container } from "@/components/ui/Container"
import { Section } from "@/components/ui/Section"
import { ServiceCard } from "@/components/blocks/ServiceCard"
import { CTASection } from "@/components/blocks/CTASection"
import { services } from "@/data/services"

export const metadata: Metadata = {
  title: "Services | TEKNIXX",
  description: "Comprehensive digital services ranging from web development to cloud infrastructure and strategic consulting.",
}

export default function ServicesPage() {
  return (
    <>
      <Section className="pt-24 pb-16 md:pt-32 md:pb-24 bg-background border-b border-border">
        <Container>
          <div className="max-w-4xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
              Our Capabilities.
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl leading-relaxed">
              We provide end-to-end technology services designed to solve specific business problems, improve operational efficiency, and drive growth.
            </p>
          </div>
        </Container>
      </Section>

      <Section className="bg-muted/50">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {services.map((service, index) => (
              <ServiceCard
                key={index}
                title={service.title}
                description={service.description}
                href={`/services/${service.slug}/`}
                icon={service.icon}
              />
            ))}
          </div>
        </Container>
      </Section>

      <CTASection
        heading="Need a tailored solution?"
        description="Every business is unique. Let's discuss your specific requirements and architect the right approach together."
        primaryAction={{
          label: "Contact Us",
          href: "/contact/",
        }}
      />
    </>
  )
}
