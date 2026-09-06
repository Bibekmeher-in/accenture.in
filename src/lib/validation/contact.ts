import { z } from "zod"
import { services } from "@/data/services"

const validServiceSlugs = services.map(s => s.slug) as [string, ...string[]]

export const contactSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .trim(),
  email: z
    .string()
    .email("Please enter a valid email address")
    .max(100, "Email must be less than 100 characters")
    .trim(),
  company: z
    .string()
    .max(100, "Company name must be less than 100 characters")
    .trim()
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .max(20, "Phone number must be less than 20 characters")
    .trim()
    .optional()
    .or(z.literal("")),
  service: z
    .string()
    .refine((val) => validServiceSlugs.includes(val), {
      message: "Please select a valid service",
    }),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message must be less than 1000 characters")
    .trim(),
  // Honeypot field (hidden from real users)
  website: z.string().optional().or(z.literal("")),
})

export type ContactFormData = z.infer<typeof contactSchema>
