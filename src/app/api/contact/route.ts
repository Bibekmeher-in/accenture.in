import { NextResponse } from "next/server"
import { contactSchema } from "@/lib/validation/contact"
import clientPromise from "@/lib/mongodb"

// Simple in-memory rate limiter suitable for local development/single instance
// For production, use Redis or a distributed store
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 5

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting (using IP if available, fallback to a global limiter for dev)
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const now = Date.now()

    const rateData = rateLimitMap.get(ip)
    if (rateData) {
      if (now > rateData.resetTime) {
        // Reset window
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
      } else if (rateData.count >= MAX_REQUESTS) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429 }
        )
      } else {
        rateLimitMap.set(ip, { count: rateData.count + 1, resetTime: rateData.resetTime })
      }
    } else {
      rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    }

    // 2. Parse request body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: "Invalid request format." },
        { status: 400 }
      )
    }

    // 3. Validate with Zod
    const validatedData = contactSchema.safeParse(body)

    if (!validatedData.success) {
      return NextResponse.json(
        {
          error: "Validation failed.",
          details: validatedData.error.flatten().fieldErrors
        },
        { status: 400 }
      )
    }

    const { website, ...leadData } = validatedData.data

    // 4. Honeypot check
    if (website && website.trim() !== "") {
      // Silently accept honeypot submissions to avoid tipping off bots
      return NextResponse.json({ success: true })
    }

    // 5. Connect to MongoDB and insert
    const client = await clientPromise
    const db = client.db("accenture")
    const collection = db.collection("leads")

    // Ensure index on createdAt (idempotent operation)
    await collection.createIndex({ createdAt: -1 })

    const newLead = {
      ...leadData,
      status: "new",
      priority: "normal",
      createdAt: new Date(),
    }

    const insertResult = await collection.insertOne(newLead)

    // Log Activity
    const { logLeadActivity } = await import("@/lib/audit")
    await logLeadActivity({
      leadId: insertResult.insertedId.toString(),
      action: "LEAD_CREATED",
      actor: "system",
      notes: "Lead received via contact form"
    })

    // 6. Return safe success response
    return NextResponse.json({ success: true })

  } catch (error) {
    // Log minimal error internally, do not expose to client
    console.error("Contact submission error:", error instanceof Error ? error.message : "Unknown error")

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
