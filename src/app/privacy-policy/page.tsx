import { Metadata } from "next"
import { Container } from "@/components/ui/Container"
import { Section } from "@/components/ui/Section"
import { SectionHeading } from "@/components/ui/SectionHeading"

export const metadata: Metadata = {
  title: "Privacy Policy | TEKNIXX",
  description: "Privacy policy and data handling practices for TEKNIXX.",
}

export default function PrivacyPolicyPage() {
  return (
    <Section>
      <Container>
        <SectionHeading
          title="Privacy Policy"
          subtitle="This is a foundational page component. Complete legal content will be added in a later phase."
        />
      </Container>
    </Section>
  )
}
