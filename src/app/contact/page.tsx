"use client"

import * as React from "react"
import { Container } from "@/components/ui/Container"
import { Section } from "@/components/ui/Section"
import { SectionHeading } from "@/components/ui/SectionHeading"
import { Button } from "@/components/ui/Button"
import { services } from "@/data/services"
import { contactSchema, ContactFormData } from "@/lib/validation/contact"
import Link from "next/link"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [errors, setErrors] = React.useState<Partial<Record<keyof ContactFormData, string>>>({})

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setServerError(null)
    setErrors({})
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())

    // Client-side Zod validation
    const validationResult = contactSchema.safeParse(data)

    if (!validationResult.success) {
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {}
      for (const [key, messages] of Object.entries(validationResult.error.flatten().fieldErrors)) {
        if (messages && messages.length > 0) {
          fieldErrors[key as keyof ContactFormData] = messages[0]
        }
      }
      setErrors(fieldErrors)
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validationResult.data),
      })

      const responseData = await response.json()

      if (!response.ok) {
        if (response.status === 400 && responseData.details) {
          // Map server-side validation errors back to fields
          const serverFieldErrors: Partial<Record<keyof ContactFormData, string>> = {}
          for (const [key, messages] of Object.entries(responseData.details as Record<string, string[]>)) {
             if (messages && messages.length > 0) {
                serverFieldErrors[key as keyof ContactFormData] = messages[0]
             }
          }
          setErrors(serverFieldErrors)
        } else {
          setServerError(responseData.error || "Something went wrong. Please try again.")
        }
        return
      }

      setSuccess(true)
      // Reset form on success
      e.currentTarget.reset()
    } catch {
      setServerError("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Section className="pt-24 pb-16 md:pt-32 md:pb-24 bg-background">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">

          {/* Introduction */}
          <div>
            <SectionHeading
              title="Let's Discuss Your Project."
              subtitle="Whether you need a completely new digital solution or improvements to an existing platform, our team is ready to help."
              className="mb-8"
            />
            <div className="prose text-muted-foreground text-lg mb-8">
              <p>
                Fill out the form with details about your requirements. One of our technical leads will review your inquiry and get back to you to schedule an initial discovery call.
              </p>
            </div>
          </div>

          {/* Form Section */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
            {success ? (
              <div className="flex flex-col items-center justify-center text-center h-full py-12">
                <CheckCircle2 className="h-16 w-16 text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-2">Message Received</h3>
                <p className="text-muted-foreground">
                  Thanks for reaching out. We&apos;ve received your message and will review it shortly.
                </p>
                <Button
                  className="mt-8"
                  variant="outline"
                  onClick={() => setSuccess(false)}
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {serverError && (
                  <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-3 text-sm">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p>{serverError}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium text-foreground">
                      Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "name-error" : undefined}
                    />
                    {errors.name && <p id="name-error" className="text-sm text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? "email-error" : undefined}
                    />
                    {errors.email && <p id="email-error" className="text-sm text-destructive">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="company" className="text-sm font-medium text-foreground">
                      Company <span className="text-muted-foreground font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-invalid={!!errors.company}
                      aria-describedby={errors.company ? "company-error" : undefined}
                    />
                    {errors.company && <p id="company-error" className="text-sm text-destructive">{errors.company}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium text-foreground">
                      Phone <span className="text-muted-foreground font-normal">(Optional)</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-invalid={!!errors.phone}
                      aria-describedby={errors.phone ? "phone-error" : undefined}
                    />
                    {errors.phone && <p id="phone-error" className="text-sm text-destructive">{errors.phone}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="service" className="text-sm font-medium text-foreground">
                    Area of Interest <span className="text-destructive">*</span>
                  </label>
                  <select
                    id="service"
                    name="service"
                    required
                    defaultValue=""
                    className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-invalid={!!errors.service}
                    aria-describedby={errors.service ? "service-error" : undefined}
                  >
                    <option value="" disabled>Select a service...</option>
                    {services.map((service) => (
                      <option key={service.slug} value={service.slug}>
                        {service.title}
                      </option>
                    ))}
                  </select>
                  {errors.service && <p id="service-error" className="text-sm text-destructive">{errors.service}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium text-foreground">
                    Message <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    className="flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? "message-error" : undefined}
                  />
                  {errors.message && <p id="message-error" className="text-sm text-destructive">{errors.message}</p>}
                </div>

                {/* Honeypot field - Hidden from real users */}
                <div className="absolute left-[-9999px] top-[-9999px]" aria-hidden="true" tabIndex={-1}>
                  <label htmlFor="website">Website (Leave blank)</label>
                  <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
                </div>

                <div className="pt-2">
                  <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Send Message"}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  By submitting this form, you agree to our{" "}
                  <Link href="/privacy-policy/" className="underline hover:text-primary transition-colors">
                    Privacy Policy
                  </Link>. Your information will only be used to respond to this inquiry.
                </p>
              </form>
            )}
          </div>
        </div>
      </Container>
    </Section>
  )
}
