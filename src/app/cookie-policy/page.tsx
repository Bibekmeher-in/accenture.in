import { Metadata } from "next"
import { Container } from "@/components/ui/Container"
import { Section } from "@/components/ui/Section"
import { SectionHeading } from "@/components/ui/SectionHeading"

export const metadata: Metadata = {
  title: "Cookie Policy | Accenture.in",
  description: "Cookie policy and tracking information for Accenture.in.",
}

export default function CookiePolicyPage() {
  return (
    <Section>
      <Container>
        <SectionHeading
          title="Cookie Policy"
          subtitle="This is a foundational page component. Complete legal content will be added in a later phase."
        />
      </Container>
    </Section>
  )
}
