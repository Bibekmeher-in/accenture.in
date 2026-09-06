import { Metadata } from "next"
import { Container } from "@/components/ui/Container"
import { Section } from "@/components/ui/Section"
import { ProjectCard } from "@/components/blocks/ProjectCard"
import { CTASection } from "@/components/blocks/CTASection"
import { getProjects } from "@/data/projects"

export const metadata: Metadata = {
  title: "Portfolio | Accenture.in",
  description: "Selected digital work, concept projects, and technical implementations.",
}

export default async function PortfolioPage() {
  const projects = await getProjects()

  return (
    <>
      <Section className="pt-24 pb-16 md:pt-32 md:pb-24 bg-background border-b border-border">
        <Container>
          <div className="max-w-4xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6 leading-tight">
              Selected Work.
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl leading-relaxed">
              A curated selection of our digital implementations, architectural concepts, and sample projects demonstrating our engineering standards.
            </p>
          </div>
        </Container>
      </Section>

      <Section className="bg-muted/50">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {projects.map((project, index) => (
              <div key={index} className="flex flex-col">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
                    {project.type}
                  </span>
                </div>
                <ProjectCard
                  title={project.title}
                  description={project.description}
                  href={`/portfolio/`}
                  tags={project.tags}
                  imageUrl={project.imageUrl}
                />
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <CTASection
        heading="Discuss your next project"
        description="Reviewing our work is just the first step. Contact us to see how these approaches translate to your specific business requirements."
        primaryAction={{
          label: "Contact Us",
          href: "/contact/",
        }}
      />
    </>
  )
}
