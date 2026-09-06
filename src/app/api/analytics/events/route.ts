import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { z } from "zod"

// Simple in-memory rate limiter for analytics events
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_EVENTS_PER_WINDOW = 100 // generous limit for typical browsing, but prevents abuse

const EventSchema = z.object({
  visitorId: z.string().uuid(),
  sessionId: z.string().uuid(),
  eventType: z.enum(["page_view", "session_start", "session_end", "form_start", "form_success", "form_error", "cta_click", "outbound_link", "404_error"]),
  pathname: z.string().max(1024),
  referrer: z.string().max(2048).optional(),
  timestamp: z.string().datetime(),
  metadata: z.record(z.string(), z.any()).optional().default({})
})

export async function POST(request: Request) {
  try {
    // 1. Check for Admin Exclusion
    // Do not track logged-in admins
    const session = await getSession()
    if (session) {
      return NextResponse.json({ success: true, ignored: true, reason: "admin" })
    }

    // 2. Parse Payload
    const body = await request.json()
    const parseResult = EventSchema.safeParse(body)

    if (!parseResult.success) {
      // Return 400 without exposing detailed validation errors which could leak info
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const data = parseResult.data

    // Hard exclusion for admin paths just in case the client script failed to block it
    if (data.pathname.startsWith("/admin") || data.pathname.startsWith("/api/admin")) {
      return NextResponse.json({ success: true, ignored: true, reason: "admin_path" })
    }

    // 3. Rate Limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    const now = Date.now()

    if (ip !== "unknown") {
      const rateData = rateLimitMap.get(ip)
      if (rateData) {
        if (now > rateData.resetTime) {
          rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
        } else if (rateData.count >= MAX_EVENTS_PER_WINDOW) {
          return NextResponse.json(
            { error: "Too many requests" },
            { status: 429 }
          )
        } else {
          rateLimitMap.set(ip, { count: rateData.count + 1, resetTime: rateData.resetTime })
        }
      } else {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
      }
    }

    // 4. Sanitize metadata deeply to prevent arbitrary huge payloads
    // Only allow specific keys in metadata
    const allowedMetadataKeys = ["viewport", "userAgent", "href", "text", "id", "formId"]
    const sanitizedMetadata: Record<string, string | number | boolean> = {}
    if (data.metadata) {
      for (const key of allowedMetadataKeys) {
        if (key in data.metadata) {
          const val = data.metadata[key]
          if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
            sanitizedMetadata[key] = typeof val === "string" ? val.slice(0, 500) : val
          }
        }
      }
    }

    // Determine basic device category from userAgent safely
    let deviceCategory = "desktop"
    const ua = (sanitizedMetadata.userAgent as string || "").toLowerCase()
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      deviceCategory = "mobile"
    } else if (ua.includes("tablet") || ua.includes("ipad")) {
      deviceCategory = "tablet"
    }

    // 5. Store in MongoDB
    const client = await clientPromise
    const db = client.db("accenture")

    // We can fire these asynchronously without awaiting to speed up response time,
    // but vercel serverless functions might terminate if we don't await.
    // Since this is a generic nextjs app, we will await safely.

    const eventDoc = {
      visitorId: data.visitorId,
      sessionId: data.sessionId,
      eventType: data.eventType,
      pathname: data.pathname.slice(0, 500), // extra safety
      referrer: data.referrer ? data.referrer.slice(0, 500) : "",
      timestamp: new Date(data.timestamp),
      metadata: sanitizedMetadata
    }

    await db.collection("analyticsEvents").insertOne(eventDoc)

    // Update Session
    const updateSession = {
      $set: {
        lastActiveAt: eventDoc.timestamp,
        deviceCategory,
        ...(sanitizedMetadata.viewport ? { viewport: sanitizedMetadata.viewport } : {})
      },
      $setOnInsert: {
        visitorId: data.visitorId,
        startedAt: eventDoc.timestamp,
        pageCount: 0
      },
      $inc: {
        pageCount: data.eventType === "page_view" ? 1 : 0
      }
    }

    await db.collection("analyticsSessions").updateOne(
      { sessionId: data.sessionId },
      updateSession,
      { upsert: true }
    )

    return NextResponse.json({ success: true })

  } catch {
    // Fail safely, do not crash or expose DB errors
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 })
  }
}
