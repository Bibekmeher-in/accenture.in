import { Metadata } from "next"
import { Container } from "@/components/ui/Container"
import { Section } from "@/components/ui/Section"
import { SectionHeading } from "@/components/ui/SectionHeading"

export const metadata: Metadata = {
  title: "Terms and Conditions | TEKNIXX",
  description: "Terms and conditions for using TEKNIXX services.",
}

export default function TermsAndConditionsPage() {
  return (
    <Section>
      <Container>
        <SectionHeading
          title="Terms and Conditions"
          subtitle="This is a foundational page component. Complete legal content will be added in a later phase."
        />
      </Container>
    </Section>
  )
}
