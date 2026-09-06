import Link from "next/link"
import { Container } from "@/components/ui/Container"
import { Section } from "@/components/ui/Section"
import { Button } from "@/components/ui/Button"

export default function NotFound() {
  return (
    <Section className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Container className="max-w-md">
        <h2 className="text-5xl font-bold tracking-tight text-foreground mb-4">404</h2>
        <h3 className="text-2xl font-semibold text-foreground mb-4">Page Not Found</h3>
        <p className="text-muted-foreground mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved or doesn&apos;t exist.
        </p>
        <Link href="/home/">
          <Button size="lg" className="w-full sm:w-auto">
            Back to Home
          </Button>
        </Link>
      </Container>
    </Section>
  )
}
